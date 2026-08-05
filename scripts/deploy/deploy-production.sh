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

SUPABASE_DB_PASSWORD="$(normalize_secret "${SUPABASE_DB_PASSWORD:-}")"
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

prepare_supabase_migrations() {
  npx supabase@latest init --force
  rm -rf supabase/migrations
  mkdir -p supabase/migrations
  cp database/migrations/001_init_schema.sql \
    supabase/migrations/20260625000001_init_schema.sql
  cp database/migrations/002_product_master_catalog.sql \
    supabase/migrations/20260708000002_product_master_catalog.sql
  cp database/migrations/003_project_lighthouse_ordering_workflow.sql \
    supabase/migrations/20260709000003_project_lighthouse_ordering_workflow.sql
  cp database/migrations/004_project_lighthouse_security_hardening.sql \
    supabase/migrations/20260712000004_project_lighthouse_security_hardening.sql
  ls -1 supabase/migrations
}

if [[ -n "${SUPABASE_PROJECT_REF:-}" && -n "$SUPABASE_DB_PASSWORD" ]]; then
  echo "Applying database changes (Supabase) to production..."
  prepare_supabase_migrations
  npx supabase@latest link \
    --project-ref "$SUPABASE_PROJECT_REF" \
    --password "$SUPABASE_DB_PASSWORD"
  npx supabase@latest db push --linked --include-all --password "$SUPABASE_DB_PASSWORD"
elif [[ -n "$SUPABASE_DB_DIRECT_URL" ]]; then
  echo "Applying database changes (Supabase) to production via direct database URL..."
  prepare_supabase_migrations
  npx supabase@latest db push --db-url "$SUPABASE_DB_DIRECT_URL"
else
  echo "Skipping production Supabase migrations because neither SUPABASE_DB_PASSWORD nor SUPABASE_DB_DIRECT_URL is configured."
fi

echo "Running production smoke tests..."
./scripts/deploy/smoke-tests.sh

echo "Production deployment completed."
