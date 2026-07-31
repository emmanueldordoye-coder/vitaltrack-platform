# Deployment Guide (Vercel + Render + Supabase)

This project deploys with:

- **Frontend**: Vercel
- **Backend**: Render (deploy hook)
- **Database**: Supabase (`supabase db push`) using the project ref + database password when available, with direct database URL fallback

## GitHub Actions workflow

Use `.github/workflows/deploy.yml` via **workflow_dispatch** with:

- `environment=staging`
- `environment=production`

## Required GitHub secrets

### Shared

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Staging

- `RENDER_STAGING_DEPLOY_HOOK_URL`
- `STAGING_SUPABASE_ACCESS_TOKEN`
- `STAGING_SUPABASE_PROJECT_REF`
- `STAGING_SUPABASE_DB_PASSWORD` (preferred when staging deploys should run `supabase db push`)
- `STAGING_SUPABASE_DB_DIRECT_URL` (optional fallback for staging database deploys)
- `STAGING_FRONTEND_URL`
- `STAGING_BACKEND_URL`
- `STAGING_SMOKE_TEST_TOKEN` (optional but recommended)

### Production

- `RENDER_PRODUCTION_DEPLOY_HOOK_URL`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PRODUCTION_PROJECT_REF`
- `PRODUCTION_SUPABASE_DB_PASSWORD` (preferred when production deploys should run `supabase db push`)
- `PRODUCTION_SUPABASE_DB_DIRECT_URL` (optional fallback for production database deploys)
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

## Supabase migration note

The deploy scripts now prefer the same authenticated Supabase CLI flow used by migration validation (`supabase link` + `supabase db push --linked`) whenever the project ref and database password are configured. If a deployment environment cannot use that flow, configure `STAGING_SUPABASE_DB_DIRECT_URL` or `PRODUCTION_SUPABASE_DB_DIRECT_URL` with the direct database connection string from **Project Settings -> Database -> Connection string** (including `sslmode=require`) as a fallback. When neither credential path is configured, the deploy workflow skips the migration step and continues with the frontend, backend, and smoke-test stages.
