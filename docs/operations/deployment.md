# Deployment Guide (Vercel + Render + Supabase)

This project deploys with:

- **Frontend**: Vercel
- **Backend**: Render (deploy hook)
- **Database**: Supabase (`supabase db push`)

## GitHub Actions workflow

Use `.github/workflows/deploy.yml` via **workflow_dispatch** with:

- `environment=staging`
- `environment=production`

## Required GitHub secrets

### Shared

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`

### Staging

- `RENDER_STAGING_DEPLOY_HOOK_URL`
- `SUPABASE_STAGING_PROJECT_REF`
- `STAGING_FRONTEND_URL`
- `STAGING_BACKEND_URL`
- `STAGING_SMOKE_TEST_TOKEN` (optional but recommended)

### Production

- `RENDER_PRODUCTION_DEPLOY_HOOK_URL`
- `SUPABASE_PRODUCTION_PROJECT_REF`
- `PRODUCTION_FRONTEND_URL`
- `PRODUCTION_BACKEND_URL`
- `PRODUCTION_SMOKE_TEST_TOKEN` (optional but recommended)

## Local/manual execution

```bash
# Staging
export VERCEL_TOKEN=...
export VERCEL_ORG_ID=...
export VERCEL_PROJECT_ID=...
export RENDER_DEPLOY_HOOK_URL=...
export SUPABASE_ACCESS_TOKEN=...
export SUPABASE_PROJECT_REF=...
export APP_BASE_URL=...
export API_BASE_URL=...
./scripts/deploy/deploy-staging.sh
```

```bash
# Production (explicit confirmation required)
export CONFIRM_PRODUCTION_DEPLOY=true
./scripts/deploy/deploy-production.sh
```

## Smoke tests

`scripts/deploy/smoke-tests.sh` verifies:

1. Frontend URL is reachable.
2. Unauthenticated API access is rejected (`401`/`403` expected).
3. Optional authenticated facilities check (`HEALTHCHECK_BEARER_TOKEN`) returns `200`.

