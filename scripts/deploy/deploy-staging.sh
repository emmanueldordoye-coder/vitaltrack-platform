#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VERCEL_TOKEN:-}" || -z "${VERCEL_ORG_ID:-}" || -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "Missing Vercel credentials (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)." >&2
  exit 1
fi

if [[ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  echo "Missing RENDER_DEPLOY_HOOK_URL." >&2
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" || -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Missing Supabase credentials (SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF)." >&2
  exit 1
fi

echo "Deploying frontend (Vercel) to staging..."
pushd frontend >/dev/null
npx vercel pull --yes --environment=preview --token "$VERCEL_TOKEN"
npx vercel deploy --yes --token "$VERCEL_TOKEN"
popd >/dev/null

echo "Deploying backend (Render) to staging..."
curl --fail --silent --show-error -X POST "$RENDER_DEPLOY_HOOK_URL" >/dev/null

echo "Applying database changes (Supabase) to staging..."
npx supabase@latest link --project-ref "$SUPABASE_PROJECT_REF"
npx supabase@latest db push

echo "Running staging smoke tests..."
./scripts/deploy/smoke-tests.sh

echo "Staging deployment completed."
