#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${APP_BASE_URL:-}" || -z "${API_BASE_URL:-}" ]]; then
  echo "Missing APP_BASE_URL or API_BASE_URL for smoke tests." >&2
  exit 1
fi

CONNECT_TIMEOUT_SECONDS=10
MAX_TIME_SECONDS=30

frontend_curl_args=(
)
if [[ -n "${VERCEL_AUTOMATION_BYPASS_SECRET:-}" ]]; then
  frontend_curl_args+=(
    -H "x-vercel-protection-bypass: ${VERCEL_AUTOMATION_BYPASS_SECRET}"
  )
fi

CURL_HTTP_STATUS=""
CURL_ELAPSED_TIME=""
CURL_EXIT_CODE=""

curl_request() {
  local request_name="$1"
  local url="$2"
  local body_file="$3"
  shift 3

  local stderr_file
  local curl_metrics
  stderr_file="$(mktemp)"

  echo "Request: ${request_name}"
  echo "URL: ${url}"
  echo "Timeouts: connect=${CONNECT_TIMEOUT_SECONDS}s max=${MAX_TIME_SECONDS}s"

  set +e
  curl_metrics="$(
    curl \
      --silent \
      --show-error \
      --connect-timeout "$CONNECT_TIMEOUT_SECONDS" \
      --max-time "$MAX_TIME_SECONDS" \
      --output "$body_file" \
      --write-out "%{http_code} %{time_total}" \
      "$@" \
      "$url" \
      2>"$stderr_file"
  )"
  CURL_EXIT_CODE=$?
  set -e

  read -r CURL_HTTP_STATUS CURL_ELAPSED_TIME <<<"$curl_metrics"
  echo "HTTP status: ${CURL_HTTP_STATUS:-000}"
  echo "Elapsed time: ${CURL_ELAPSED_TIME:-unknown}s"
  echo "curl exit code: ${CURL_EXIT_CODE}"

  if [[ "$CURL_EXIT_CODE" != "0" ]]; then
    echo "Smoke test request failed: ${request_name}" >&2
    echo "Failing URL: ${url}" >&2
    echo "curl exit code: ${CURL_EXIT_CODE}" >&2
    if [[ -s "$stderr_file" ]]; then
      echo "curl error:" >&2
      sed -n '1,20p' "$stderr_file" >&2
    fi
    rm -f "$stderr_file"
    exit 1
  fi

  rm -f "$stderr_file"
}

echo "Smoke test: frontend reachable"
body_file="$(mktemp)"
curl_request "frontend reachable" "$APP_BASE_URL" "$body_file" "${frontend_curl_args[@]}"
rm -f "$body_file"
if [[ ! "$CURL_HTTP_STATUS" =~ ^[23] ]]; then
  echo "Expected frontend reachability check to return 2xx/3xx, got $CURL_HTTP_STATUS." >&2
  exit 1
fi

verify_git_sha() {
  local name="$1"
  local url="$2"
  local expected_sha="$3"
  shift 3
  local actual_sha
  local body_file

  body_file="$(mktemp)"
  curl_request "${name} git SHA" "$url" "$body_file" "$@"
  actual_sha="$(
    python3 -c 'import json, pathlib, sys; raw=pathlib.Path(sys.argv[1]).read_text()
try:
    payload=json.loads(raw)
except json.JSONDecodeError:
    print("Expected JSON from health endpoint but received non-JSON. If this is a Vercel preview deployment, configure VERCEL_AUTOMATION_BYPASS_SECRET for smoke tests.", file=sys.stderr)
    print(f"Response prefix: {raw[:160]!r}", file=sys.stderr)
    raise SystemExit(1)
data=payload.get("data", payload)
print(data.get("gitSha") or data.get("git_sha") or "")' "$body_file"
  )"
  rm -f "$body_file"

  if [[ "$actual_sha" != "$expected_sha" ]]; then
    echo "Expected ${name} git SHA ${expected_sha}, got ${actual_sha:-<empty>}." >&2
    return 1
  fi
}

if [[ -n "${EXPECTED_GIT_SHA:-}" ]]; then
  echo "Smoke test: frontend git SHA"
  verify_git_sha "frontend" "$APP_BASE_URL/api/health" "$EXPECTED_GIT_SHA" "${frontend_curl_args[@]}"
fi

echo "Smoke test: protected facilities endpoint denies unauthenticated requests"
body_file="$(mktemp)"
curl_request "unauthenticated facilities endpoint" "$API_BASE_URL/facilities" "$body_file"
status_code="$CURL_HTTP_STATUS"
rm -f "$body_file"
if [[ "$status_code" != "401" && "$status_code" != "403" ]]; then
  echo "Expected 401/403 from unauthenticated facilities endpoint, got $status_code." >&2
  exit 1
fi

if [[ -n "${EXPECTED_GIT_SHA:-}" ]]; then
  echo "Smoke test: backend git SHA"
  for attempt in {1..30}; do
    if verify_git_sha "backend" "$API_BASE_URL/health" "$EXPECTED_GIT_SHA"; then
      break
    fi

    if [[ "$attempt" == "30" ]]; then
      exit 1
    fi

    sleep 10
  done
fi

if [[ -n "${HEALTHCHECK_BEARER_TOKEN:-}" ]]; then
  echo "Smoke test: authenticated facilities endpoint responds"
  body_file="$(mktemp)"
  curl_request \
    "authenticated facilities endpoint" \
    "$API_BASE_URL/facilities?limit=1" \
    "$body_file" \
    -H "Authorization: Bearer ${HEALTHCHECK_BEARER_TOKEN}"
  auth_status="$CURL_HTTP_STATUS"
  rm -f "$body_file"
  if [[ "$auth_status" != "200" ]]; then
    echo "Expected 200 from authenticated facilities endpoint, got $auth_status." >&2
    exit 1
  fi
fi

echo "Smoke tests passed."
