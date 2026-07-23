#!/usr/bin/env bash
set -euo pipefail

normalize_secret() {
  local value="${1:-}"

  # Remove carriage returns/newlines introduced while copying secrets.
  value="$(printf '%s' "$value" | tr -d '\r\n')"

  # Trim leading/trailing whitespace.
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"

  # Remove one matching pair of surrounding quotes if pasted into GitHub.
  if [[ ${#value} -ge 2 ]]; then
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi

  printf '%s' "$value"
}

VERCEL_TOKEN="$(normalize_secret "${VERCEL_TOKEN:-}")"
VERCEL_ORG_ID="$(normalize_secret "${VERCEL_ORG_ID:-}")"
VERCEL_PROJECT_ID="$(normalize_secret "${VERCEL_PROJECT_ID:-}")"

if [[ -z "$VERCEL_TOKEN" || -z "$VERCEL_ORG_ID" || -z "$VERCEL_PROJECT_ID" ]]; then
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

deploy_git_sha="${EXPECTED_GIT_SHA:-${GIT_SHA:-$(git rev-parse HEAD)}}"
echo "Deploying git commit: ${deploy_git_sha}"

echo "Verifying Vercel authentication..."
echo "Vercel token length after normalization: ${#VERCEL_TOKEN}"
if ! vercel_identity="$(npx vercel@latest whoami --token "$VERCEL_TOKEN" 2>&1)"; then
  echo "$vercel_identity" >&2
  echo "Vercel authentication failed after removing whitespace and surrounding quotes. Replace the GitHub staging environment secret VERCEL_TOKEN with the raw token value that succeeds with 'vercel whoami'." >&2
  exit 1
fi
echo "Vercel authentication succeeded for: ${vercel_identity}"

echo "Deploying frontend (Vercel) to staging..."
pushd frontend >/dev/null
npx vercel pull --yes --environment=preview --token "$VERCEL_TOKEN"
vercel_output="$(
  npx vercel deploy \
    --yes \
    --token "$VERCEL_TOKEN" \
    --env "NEXT_PUBLIC_GIT_SHA=${deploy_git_sha}" \
    --build-env "NEXT_PUBLIC_GIT_SHA=${deploy_git_sha}"
)"
echo "$vercel_output"
vercel_deployment_url="$(
  printf '%s\n' "$vercel_output" \
    | grep -Eo 'https://[^[:space:]]+\.vercel\.app' \
    | tail -n 1
)"
if [[ -z "$vercel_deployment_url" ]]; then
  echo "Unable to determine Vercel deployment URL from deploy output." >&2
  exit 1
fi
echo "Vercel deployment URL: ${vercel_deployment_url}"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "frontend_url=${vercel_deployment_url}" >> "$GITHUB_OUTPUT"
fi
popd >/dev/null

echo "Deploying backend (Render) to staging..."
render_deploy_url="$(
  RENDER_DEPLOY_HOOK_URL="$RENDER_DEPLOY_HOOK_URL" DEPLOY_GIT_SHA="$deploy_git_sha" python3 <<'PY'
import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

url = os.environ["RENDER_DEPLOY_HOOK_URL"]
sha = os.environ["DEPLOY_GIT_SHA"]
parts = urlsplit(url)
query = dict(parse_qsl(parts.query, keep_blank_values=True))
query["ref"] = sha
print(urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)))
PY
)"
curl --fail --silent --show-error -X POST "$render_deploy_url" >/dev/null
echo "Render deploy hook triggered for git commit: ${deploy_git_sha}"

echo "Applying database changes (Supabase) to staging..."
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

if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  npx supabase@latest link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
  npx supabase@latest db push --password "$SUPABASE_DB_PASSWORD"
else
  npx supabase@latest link --project-ref "$SUPABASE_PROJECT_REF"
  npx supabase@latest db push
fi

echo "Running staging smoke tests..."
APP_BASE_URL="$vercel_deployment_url" EXPECTED_GIT_SHA="$deploy_git_sha" ./scripts/deploy/smoke-tests.sh

echo "Staging deployment completed."
