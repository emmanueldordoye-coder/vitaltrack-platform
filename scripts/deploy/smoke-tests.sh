#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${APP_BASE_URL:-}" || -z "${API_BASE_URL:-}" ]]; then
  echo "Missing APP_BASE_URL or API_BASE_URL for smoke tests." >&2
  exit 1
fi

frontend_curl_args=(
  --fail
  --silent
  --show-error
  --connect-timeout 10
  --max-time 30
)
if [[ -n "${VERCEL_AUTOMATION_BYPASS_SECRET:-}" ]]; then
  frontend_curl_args+=(
    -H "x-vercel-protection-bypass: ${VERCEL_AUTOMATION_BYPASS_SECRET}"
  )
fi

echo "Smoke test: frontend reachable"
curl "${frontend_curl_args[@]}" "$APP_BASE_URL" >/dev/null

verify_git_sha() {
  local name="$1"
  local url="$2"
  local expected_sha="$3"
  local actual_sha

  actual_sha="$(
    curl "${frontend_curl_args[@]}" "$url" \
      | python3 -c 'import json, sys; raw=sys.stdin.read()
try:
    payload=json.loads(raw)
except json.JSONDecodeError:
    print("Expected JSON from health endpoint but received non-JSON. If this is a Vercel preview deployment, configure VERCEL_AUTOMATION_BYPASS_SECRET for smoke tests.", file=sys.stderr)
    print(f"Response prefix: {raw[:160]!r}", file=sys.stderr)
    raise SystemExit(1)
data=payload.get("data", payload)
print(data.get("gitSha") or data.get("git_sha") or "")'
  )"

  if [[ "$actual_sha" != "$expected_sha" ]]; then
    echo "Expected ${name} git SHA ${expected_sha}, got ${actual_sha:-<empty>}." >&2
    return 1
  fi
}

if [[ -n "${EXPECTED_GIT_SHA:-}" ]]; then
  echo "Smoke test: frontend git SHA"
  verify_git_sha "frontend" "$APP_BASE_URL/api/health" "$EXPECTED_GIT_SHA"
fi

echo "Smoke test: protected facilities endpoint denies unauthenticated requests"
status_code="$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$API_BASE_URL/facilities")"
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
  auth_status="$(curl -s -o /dev/null -w "%{http_code}" \
    --connect-timeout 10 \
    --max-time 30 \
    -H "Authorization: Bearer ${HEALTHCHECK_BEARER_TOKEN}" \
    "$API_BASE_URL/facilities?limit=1")"
  if [[ "$auth_status" != "200" ]]; then
    echo "Expected 200 from authenticated facilities endpoint, got $auth_status." >&2
    exit 1
  fi
fi

echo "Smoke tests passed."
