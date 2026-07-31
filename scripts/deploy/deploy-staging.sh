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
SUPABASE_DB_PASSWORD="$(normalize_secret "${SUPABASE_DB_PASSWORD:-}")"
export SUPABASE_DB_PASSWORD

if [[ -z "$VERCEL_TOKEN" || -z "$VERCEL_ORG_ID" || -z "$VERCEL_PROJECT_ID" ]]; then
  echo "Missing Vercel credentials (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)." >&2
  exit 1
fi

if [[ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  echo "Missing RENDER_DEPLOY_HOOK_URL." >&2
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" || -z "${SUPABASE_PROJECT_REF:-}" || -z "$SUPABASE_DB_PASSWORD" ]]; then
  echo "Missing Supabase credentials (SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD)." >&2
  exit 1
fi

deploy_git_sha="${EXPECTED_GIT_SHA:-${GIT_SHA:-$(git rev-parse HEAD)}}"
echo "Deploying git commit: ${deploy_git_sha}"

supabase_url="https://${SUPABASE_PROJECT_REF}.supabase.co"
echo "Resolving Supabase anon key for the staging frontend build..."
supabase_api_keys_json="$(
  npx supabase@latest projects api-keys \
    --project-ref "$SUPABASE_PROJECT_REF" \
    --reveal \
    --output json
)"
supabase_anon_key="$(
  SUPABASE_API_KEYS_JSON="$supabase_api_keys_json" python3 <<'PY'
import json
import os

data = json.loads(os.environ["SUPABASE_API_KEYS_JSON"])
keys = data if isinstance(data, list) else data.get("apiKeys", [])

for item in keys:
    name = str(item.get("name") or item.get("type") or item.get("role") or "").lower()
    if name in {"anon", "publishable"} or name.endswith("_anon"):
        print(item.get("api_key") or item.get("apiKey") or item.get("key") or "")
        break
PY
)"
if [[ -z "$supabase_anon_key" ]]; then
  echo "Unable to resolve the staging Supabase anon key." >&2
  exit 1
fi

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
echo "Installing frontend dependencies for Vercel prebuilt deployment..."
npm install --workspaces=false --include=dev --no-audit --no-fund --package-lock=false
npx vercel pull --yes --environment=preview --token "$VERCEL_TOKEN"
export NEXT_PUBLIC_GIT_SHA="$deploy_git_sha"
export NEXT_PUBLIC_SUPABASE_URL="$supabase_url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$supabase_anon_key"
if [[ -n "${API_BASE_URL:-}" ]]; then
  export NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL"
  export API_BASE_URL
fi
echo "Building frontend locally for Vercel staging..."
npx vercel build --yes --target=preview --token "$VERCEL_TOKEN"
vercel_deploy_args=(
  --prebuilt
  --yes
  --token "$VERCEL_TOKEN"
  --env "NEXT_PUBLIC_GIT_SHA=${deploy_git_sha}"
  --env "NEXT_PUBLIC_SUPABASE_URL=${supabase_url}"
  --env "NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabase_anon_key}"
)
if [[ -n "${API_BASE_URL:-}" ]]; then
  vercel_deploy_args+=(
    --env "NEXT_PUBLIC_API_BASE_URL=${API_BASE_URL}"
    --env "API_BASE_URL=${API_BASE_URL}"
  )
fi
popd >/dev/null
echo "Preparing repository-root Vercel prebuilt output..."
python3 <<'PY'
from pathlib import Path
import shutil

root = Path.cwd()
frontend_vercel = root / "frontend" / ".vercel"
root_vercel = root / ".vercel"

if root_vercel.exists():
    shutil.rmtree(root_vercel)

root_vercel.mkdir(parents=True)
shutil.copy2(frontend_vercel / "project.json", root_vercel / "project.json")
shutil.copytree(frontend_vercel / "output", root_vercel / "output")
PY
vercel_output="$(
  npx vercel deploy "${vercel_deploy_args[@]}"
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

npx supabase@latest link --project-ref "$SUPABASE_PROJECT_REF"
echo "Resolving Supabase project region for pooler connection..."
supabase_project_region="$(
  SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
  SUPABASE_PROJECT_REF="$SUPABASE_PROJECT_REF" \
  python3 <<'PY'
import json, os, urllib.request
url = "https://api.supabase.com/v1/projects/{}".format(os.environ["SUPABASE_PROJECT_REF"])
req = urllib.request.Request(url, headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"]})
with urllib.request.urlopen(req) as resp:
    data = json.load(resp)
print(data["region"])
PY
)"
shell_options="$-"
set +x
supabase_pooler_url="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-${supabase_project_region}.pooler.supabase.com:5432/postgres"
npx supabase@latest db push --db-url "$supabase_pooler_url"
if [[ "$shell_options" == *x* ]]; then
  set -x
fi

echo "Running staging smoke tests..."
APP_BASE_URL="$vercel_deployment_url" EXPECTED_GIT_SHA="$deploy_git_sha" ./scripts/deploy/smoke-tests.sh

echo "Staging deployment completed."
