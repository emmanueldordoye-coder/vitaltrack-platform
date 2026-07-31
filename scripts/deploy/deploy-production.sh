#!/usr/bin/env bash
set -euo pipefail

normalize_secret() {
  local value="${1:-}"

  value="$(printf '%s' "$value" | tr -d '\r\n')"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"

  if [[ ${#value} -ge 2 ]]; then
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi

  printf '%s' "$value"
}

SUPABASE_DB_DIRECT_URL="$(normalize_secret "${SUPABASE_DB_DIRECT_URL:-}")"

if [[ "${CONFIRM_PRODUCTION_DEPLOY:-}" != "true" ]]; then
  echo "Refusing production deploy. Set CONFIRM_PRODUCTION_DEPLOY=true to continue." >&2
  exit 1
fi

if [[ -z "${VERCEL_TOKEN:-}" || -z "${VERCEL_ORG_ID:-}" || -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "Missing Vercel credentials (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)." >&2
  exit 1
fi

if [[ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  echo "Missing RENDER_DEPLOY_HOOK_URL." >&2
  exit 1
fi

echo "Deploying frontend (Vercel) to production..."
pushd frontend >/dev/null
npx vercel pull --yes --environment=production --token "$VERCEL_TOKEN"
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
popd >/dev/null

echo "Deploying backend (Render) to production..."
curl --fail --silent --show-error -X POST "$RENDER_DEPLOY_HOOK_URL" >/dev/null

if [[ -n "$SUPABASE_DB_DIRECT_URL" ]]; then
  echo "Applying database changes (Supabase) to production..."
  npx supabase@latest db push --db-url "$SUPABASE_DB_DIRECT_URL"
else
  echo "Skipping production Supabase migrations because SUPABASE_DB_DIRECT_URL is not configured."
  echo "GitHub-hosted runners cannot use the Supabase pooler for 'supabase db push'; configure the direct database URL when migrations must run during deploy."
fi

echo "Running production smoke tests..."
./scripts/deploy/smoke-tests.sh

echo "Production deployment completed."
