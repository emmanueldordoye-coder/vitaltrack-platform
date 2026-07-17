# Supabase Migration Validation

This runbook validates the Project Lighthouse database migrations against a non-production Supabase project. It is intended for the Dentira demo workflow only and must not be pointed at production.

## Validation Target

Use a staging or dedicated throwaway Supabase project. A fresh project is preferred because the workflow applies the full migration chain:

1. `database/migrations/001_init_schema.sql`
2. `database/migrations/002_product_master_catalog.sql`
3. `database/migrations/003_project_lighthouse_ordering_workflow.sql`
4. `database/migrations/004_project_lighthouse_security_hardening.sql`
5. `database/seeds/004_project_lighthouse_dentira_demo.sql`

The workflow adapts the existing `database/migrations` layout into a temporary `supabase/migrations` directory during the GitHub Actions run. It does not move or rename repository SQL files.

Migration `004_project_lighthouse_security_hardening.sql` is a follow-up to PR #9. PR #9 merged `003_project_lighthouse_ordering_workflow.sql` into main before the security hardening was included, so `003` is now published migration history and must not be rewritten. Migration `004` applies the hardening in place without replacing or amending the merged migration.

The first live staging validation attempt reached `supabase db push` and failed inside `001_init_schema.sql` before any successful Project Lighthouse migration validation run existed. The failure was caused by custom helper functions being created in Supabase's managed `auth` schema. Migration `001` was corrected before first successful deployment by moving those helpers to `public.current_user_organization_id()` and `public.current_user_role()`. Future migrations must not create custom objects in managed schemas such as `auth` or `storage`; the workflow checks migration files for that pattern before linking to Supabase.

## Required GitHub Secrets

Add these secrets to the repository or the protected `staging` GitHub environment:

| Secret | Purpose |
| --- | --- |
| `STAGING_SUPABASE_ACCESS_TOKEN` | Supabase personal access token used by the CLI for staging validation. |
| `STAGING_SUPABASE_PROJECT_REF` | Project ref for the staging or dedicated test Supabase project. |
| `APPROVED_STAGING_SUPABASE_PROJECT_REF` | Approved staging project ref. The workflow fails if this does not match `STAGING_SUPABASE_PROJECT_REF`. |
| `STAGING_SUPABASE_DB_PASSWORD` | Database password for the staging or dedicated test Supabase project. |
| `STAGING_SUPABASE_DB_HOST` | Session-pooler host used by `psql` seed and validation steps. |
| `STAGING_SUPABASE_DB_PORT` | Session-pooler port used by `psql` seed and validation steps. |
| `STAGING_SUPABASE_DB_USER` | Session-pooler database user used by `psql` seed and validation steps. |

Do not use production values for these secrets.

## Select or Create a Staging Project

1. In Supabase, create a new project for Project Lighthouse validation or select an existing staging project that can be safely reset.
2. Confirm the project is not connected to production users, production data, or production services.
3. Copy the project ref from the Supabase project URL or project settings.
4. Confirm you have the database password. If it has been lost, rotate or reset it in Supabase before running validation.

## Add Secrets in GitHub

1. Open the GitHub repository.
2. Go to **Settings** -> **Secrets and variables** -> **Actions**.
3. Add `STAGING_SUPABASE_ACCESS_TOKEN`, `STAGING_SUPABASE_PROJECT_REF`, `APPROVED_STAGING_SUPABASE_PROJECT_REF`, `STAGING_SUPABASE_DB_PASSWORD`, `STAGING_SUPABASE_DB_HOST`, `STAGING_SUPABASE_DB_PORT`, and `STAGING_SUPABASE_DB_USER`.
4. If the repository uses GitHub environments, add the same secrets under the `staging` environment and keep any approval rules enabled.

For the pooler connection values, open the staging Supabase project and go to **Project Settings** -> **Database** -> **Connection string** -> **Session pooler**. Copy the host, port, and user values exactly from the session-pooler connection string:

- `STAGING_SUPABASE_DB_HOST`: session-pooler host.
- `STAGING_SUPABASE_DB_PORT`: session-pooler port.
- `STAGING_SUPABASE_DB_USER`: session-pooler user.
- `STAGING_SUPABASE_DB_PASSWORD`: the staging database password for that user.

## Trigger the Workflow

1. Open the repository's **Actions** tab.
2. Select **Validate Supabase Migrations**.
3. Choose **Run workflow**.
4. Select the `main` branch.
5. Enter `VALIDATE_STAGING` in the confirmation field.
6. Start the run.

The confirmation value is required so the workflow fails before checkout if it is launched accidentally.

## What the Workflow Validates

The workflow performs these checks:

1. Confirms required secrets are present.
2. Confirms the configured staging project ref matches the approved staging project ref.
3. Installs the Supabase CLI and PostgreSQL client.
4. Validates migration file order.
5. Checks SQL files for static hazards such as merge conflict markers and custom object creation in Supabase-managed schemas.
6. Links to the staging Supabase project.
7. Runs `supabase db push --dry-run`.
8. Applies all migrations to staging.
9. Runs the Dentira seed file twice to confirm idempotency.
10. Confirms these tables exist:
   - `products`
   - `categories`
   - `manufacturers`
   - `vendors`
   - `units_of_measure`
   - `locations`
   - `inventory_levels`
   - `suggested_orders`
   - `suggested_order_items`
   - `purchase_orders`
   - `purchase_order_items`
   - `receiving_events`
11. Confirms Row Level Security is enabled on the expected tenant tables.
12. Confirms foreign keys and expected indexes exist.
13. Confirms Dentira seed counts and low-stock detection.
14. Runs `database/validation/005_project_lighthouse_security_validation.sql` to prove cross-tenant access is rejected, same-tenant manager workflow still succeeds, receiving events are append-only, and `received_by` cannot be spoofed.

Production is not touched by this workflow. The workflow requires the protected `staging` GitHub environment, staging-specific secrets, and a manual `VALIDATE_STAGING` confirmation before it links to any Supabase project.

The workflow pins:

- `actions/checkout` to `34e114876b0b11c390a56381ad16ebd13914f8d5`
- `supabase/setup-cli` to `46f7f98c7f948ad727d22c1e67fab04c223a0520`
- Supabase CLI to `2.109.1`

## Successful Run Indicators

A successful run should show:

- `Migration order:` followed by the four migration files.
- `Finished supabase link.`
- A successful `supabase db push --dry-run`.
- A successful `supabase db push`.
- Two successful executions of `database/seeds/004_project_lighthouse_dentira_demo.sql`.
- No raised PostgreSQL exceptions from schema, RLS, foreign key, index, seed, or suggested-order checks.
- A successful execution of `005_project_lighthouse_security_validation.sql`.
- A GitHub Actions summary headed `Project Lighthouse Supabase Validation`.

## Confirm Migrations Succeeded

After a successful run, confirm in the Supabase dashboard:

1. Open the staging project.
2. Go to the table editor or SQL editor.
3. Confirm the Project Lighthouse tables are present.
4. Confirm `inventory_levels` contains seven Dentira demo rows.
5. Confirm `lighthouse_low_stock_products` returns low-stock Dentira products.
6. Confirm the Actions log shows `005_project_lighthouse_security_validation.sql` completed. That validation exercises suggested-order generation, approval, receiving, append-only receiving protections, and `received_by` attribution inside a rollback transaction, so it should not leave validation orders behind.

## Common Errors

| Error | Likely Cause | Fix |
| --- | --- | --- |
| `Missing required GitHub secret` | One or more required secrets are not configured for Actions or the `staging` environment. | Add `STAGING_SUPABASE_ACCESS_TOKEN`, `STAGING_SUPABASE_PROJECT_REF`, `APPROVED_STAGING_SUPABASE_PROJECT_REF`, `STAGING_SUPABASE_DB_PASSWORD`, `STAGING_SUPABASE_DB_HOST`, `STAGING_SUPABASE_DB_PORT`, and `STAGING_SUPABASE_DB_USER`. |
| `Configured staging project ref does not match the approved staging project ref` | The workflow target does not match the approved staging project guard. | Confirm both staging project ref secrets point to the same non-production project. |
| `This workflow only runs when the confirmation input is VALIDATE_STAGING` | The manual confirmation input was blank or misspelled. | Re-run with exactly `VALIDATE_STAGING`. |
| `failed to connect to postgres` or `password authentication failed` | Incorrect database password, project ref, or session-pooler connection value. | Verify `STAGING_SUPABASE_PROJECT_REF`, `STAGING_SUPABASE_DB_HOST`, `STAGING_SUPABASE_DB_PORT`, `STAGING_SUPABASE_DB_USER`, and `STAGING_SUPABASE_DB_PASSWORD`. |
| `permission denied for schema auth` while creating a custom helper | A migration is attempting to create repository-owned objects in Supabase's managed `auth` schema. | Move custom helpers to an application-owned schema such as `public` and update references. Keep Supabase-native calls like `auth.uid()` fully qualified. |
| `relation already exists`, `policy already exists`, or duplicate trigger errors | The target staging project has partial schema state but no matching migration history. | Use a fresh staging project or reset the dedicated staging database before rerunning. |
| `Migration file ordering does not match` | A migration file was added, renamed, or removed without updating the validation workflow. | Review the new migration order and update the workflow intentionally. |
| `Missing expected tables`, `Missing expected indexes`, or `RLS is not enabled` | A migration did not apply or the schema differs from the expected Project Lighthouse workflow. | Open the failed step logs, fix the migration, and rerun on a clean staging project. |
| `Expected 7 Dentira demo products` or `Expected 7 Dentira inventory levels` | Seed data failed or was modified unexpectedly. | Review the seed step output and keep the Dentira seed idempotent. |
| Network or IPv6 connection failures from `psql` | The runner cannot reach the Supabase direct database host or the pooler secrets are missing. | Use the session-pooler host, port, and user from **Project Settings** -> **Database** -> **Connection string** -> **Session pooler**. |

## Rollback or Reset Plan

Do not roll back production. This workflow is for staging or a dedicated validation project only.

Preferred reset path:

1. Delete and recreate the dedicated validation Supabase project, or create a new disposable staging project.
2. Update `STAGING_SUPABASE_PROJECT_REF`, `APPROVED_STAGING_SUPABASE_PROJECT_REF`, `STAGING_SUPABASE_DB_PASSWORD`, `STAGING_SUPABASE_DB_HOST`, `STAGING_SUPABASE_DB_PORT`, and `STAGING_SUPABASE_DB_USER` in GitHub secrets.
3. Re-run the workflow from the `main` branch.

If the staging project must be preserved:

1. Review the failed migration step and identify whether the failure happened before or after `supabase db push`.
2. Use the Supabase dashboard backup/restore tools if backups are enabled.
3. If the project is dedicated to validation and has approval from the project owner, reset the staging database from a trusted local machine with the Supabase CLI.
4. Re-run the workflow only after confirming the target remains non-production.

If the failure is only seed-related, fix the seed file or clear the Dentira demo rows in staging after confirming no other staging users depend on them.
