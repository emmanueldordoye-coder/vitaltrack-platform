#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${APP_BASE_URL:-}" || -z "${API_BASE_URL:-}" ]]; then
  echo "Missing APP_BASE_URL or API_BASE_URL for smoke tests." >&2
  exit 1
fi

echo "Smoke test: frontend reachable"
curl --fail --silent --show-error "$APP_BASE_URL" >/dev/null

echo "Smoke test: protected facilities endpoint denies unauthenticated requests"
status_code="$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/facilities")"
if [[ "$status_code" != "401" && "$status_code" != "403" ]]; then
  echo "Expected 401/403 from unauthenticated facilities endpoint, got $status_code." >&2
  exit 1
fi

if [[ -n "${HEALTHCHECK_BEARER_TOKEN:-}" ]]; then
  echo "Smoke test: authenticated facilities endpoint responds"
  auth_status="$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${HEALTHCHECK_BEARER_TOKEN}" \
    "$API_BASE_URL/facilities?limit=1")"
  if [[ "$auth_status" != "200" ]]; then
    echo "Expected 200 from authenticated facilities endpoint, got $auth_status." >&2
    exit 1
  fi
fi

echo "Smoke tests passed."
