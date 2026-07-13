# Supabase Migration Validation

This runbook validates the Project Lighthouse database migrations against a non-production Supabase project. It is intended for the Dentira demo workflow only and must not be pointed at production.

## Validation Target

Use a staging or dedicated throwaway Supabase project. A fresh project is preferred because the workflow applies the full migration chain:

1. `database/migrations/001_init_schema.sql`
2. `database/migrations/002_product_master_catalog.sql`
3. `database/migrations/003_project_lighthouse_ordering_workflow.sql`
4. `database/seeds/004_project_lighthouse_dentira_demo.sql`

The workflow adapts the existing `database/migrations` layout into a temporary `supabase/migrations` directory during the GitHub Actions run. It does not move or rename repository SQL files.

## Required GitHub Secrets

Add these secrets to the repository or the protected `staging` GitHub environment:

| Secret | Purpose |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token used by the CLI. |
| `SUPABASE_PROJECT_REF` | Project ref for the staging or dedicated test Supabase project. |
| `SUPABASE_DB_PASSWORD` | Database password for the staging or dedicated test Supabase project. |

Do not use production values for these secrets.

## Select or Create a Staging Project

1. In Supabase, create a new project for Project Lighthouse validation or select an existing staging project that can be safely reset.
2. Confirm the project is not connected to production users, production data, or production services.
3. Copy the project ref from the Supabase project URL or project settings.
4. Confirm you have the database password. If it has been lost, rotate or reset it in Supabase before running validation.

## Add Secrets in GitHub

1. Open the GitHub repository.
2. Go to **Settings** -> **Secrets and variables** -> **Actions**.
3. Add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, and `SUPABASE_DB_PASSWORD`.
4. If the repository uses GitHub environments, add the same secrets under the `staging` environment and keep any approval rules enabled.

## Trigger the Workflow

1. Open the repository's **Actions** tab.
2. Select **Validate Supabase Migrations**.
3. Choose **Run workflow**.
4. Select the `project-lighthouse-ordering-workflow` branch.
5. Enter `VALIDATE_STAGING` in the confirmation field.
6. Start the run.

The confirmation value is required so the workflow fails before checkout if it is launched accidentally.

## What the Workflow Validates

The workflow performs these checks:

1. Confirms required secrets are present.
2. Installs the Supabase CLI and PostgreSQL client.
3. Validates migration file order.
4. Checks SQL files for static hazards such as merge conflict markers.
5. Links to the staging Supabase project.
6. Runs `supabase db push --dry-run`.
7. Applies all migrations to staging.
8. Runs the Dentira seed file twice to confirm idempotency.
9. Confirms these tables exist:
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
10. Confirms Row Level Security is enabled on the expected tenant tables.
11. Confirms foreign keys and expected indexes exist.
12. Confirms Dentira seed counts and low-stock suggested order generation.

## Successful Run Indicators

A successful run should show:

- `Migration order:` followed by the three migration files.
- `Finished supabase link.`
- A successful `supabase db push --dry-run`.
- A successful `supabase db push`.
- Two successful executions of `004_project_lighthouse_dentira_demo.sql`.
- No raised PostgreSQL exceptions from schema, RLS, foreign key, index, seed, or suggested-order checks.
- A GitHub Actions summary headed `Project Lighthouse Supabase Validation`.

## Confirm Migrations Succeeded

After a successful run, confirm in the Supabase dashboard:

1. Open the staging project.
2. Go to the table editor or SQL editor.
3. Confirm the Project Lighthouse tables are present.
4. Confirm `inventory_levels` contains seven Dentira demo rows.
5. Confirm `lighthouse_low_stock_products` returns low-stock Dentira products.
6. Confirm one or more `suggested_orders` rows exist after the smoke check.

## Common Errors

| Error | Likely Cause | Fix |
| --- | --- | --- |
| `Missing required GitHub secret` | One or more required secrets are not configured for Actions or the `staging` environment. | Add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, and `SUPABASE_DB_PASSWORD`. |
| `This workflow only runs when the confirmation input is VALIDATE_STAGING` | The manual confirmation input was blank or misspelled. | Re-run with exactly `VALIDATE_STAGING`. |
| `failed to connect to postgres` or `password authentication failed` | Incorrect database password or project ref. | Verify `SUPABASE_PROJECT_REF` and reset `SUPABASE_DB_PASSWORD` if needed. |
| `relation already exists`, `policy already exists`, or duplicate trigger errors | The target staging project has partial schema state but no matching migration history. | Use a fresh staging project or reset the dedicated staging database before rerunning. |
| `Migration file ordering does not match` | A migration file was added, renamed, or removed without updating the validation workflow. | Review the new migration order and update the workflow intentionally. |
| `Missing expected tables`, `Missing expected indexes`, or `RLS is not enabled` | A migration did not apply or the schema differs from the expected Project Lighthouse workflow. | Open the failed step logs, fix the migration, and rerun on a clean staging project. |
| `Expected 7 Dentira demo products` or `Expected 7 Dentira inventory levels` | Seed data failed or was modified unexpectedly. | Review the seed step output and keep the Dentira seed idempotent. |
| Network or IPv6 connection failures from `psql` | The runner cannot reach the Supabase direct database host. | Confirm database networking settings and rerun. If needed, use a dedicated project without network restrictions. |

## Rollback or Reset Plan

Do not roll back production. This workflow is for staging or a dedicated validation project only.

Preferred reset path:

1. Delete and recreate the dedicated validation Supabase project, or create a new disposable staging project.
2. Update `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD` in GitHub secrets.
3. Re-run the workflow from the `project-lighthouse-ordering-workflow` branch.

If the staging project must be preserved:

1. Review the failed migration step and identify whether the failure happened before or after `supabase db push`.
2. Use the Supabase dashboard backup/restore tools if backups are enabled.
3. If the project is dedicated to validation and has approval from the project owner, reset the staging database from a trusted local machine with the Supabase CLI.
4. Re-run the workflow only after confirming the target remains non-production.

If the failure is only seed-related, fix the seed file or clear the Dentira demo rows in staging after confirming no other staging users depend on them.
