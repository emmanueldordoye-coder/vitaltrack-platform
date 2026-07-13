# Project Lighthouse Ordering Workflow

**Status**: Active  
**Last Updated**: 2026-07-13
**Scope**: Dentira pilot database workflow for low-stock ordering

## Workflow

Project Lighthouse supports the ordering workflow already represented in the Dentira Figma prototype:

1. Product Catalog
2. Low Stock Detection
3. Suggested Orders
4. Suggested Order Review
5. Approve Order
6. Purchase Confirmation
7. Receiving

The workflow starts from Product Master Catalog rows in `products`, vendor details in `vendors`, and location-level thresholds in `inventory_levels`.

Migration `004_project_lighthouse_security_hardening.sql` exists because PR #9 merged migration `003_project_lighthouse_ordering_workflow.sql` before the security hardening was included. Migration `003` is now part of published migration history and must not be rewritten; `004` safely replaces the workflow RPC definitions, low-stock read model, receiving policy, and grants in place.

`lighthouse_low_stock_products` exposes active inventory rows where `current_quantity` is at or below `reorder_point`.

`lighthouse_generate_suggested_orders()` groups low-stock items by vendor and location. It creates one `suggested_orders` header per vendor/location and one `suggested_order_items` row per low-stock product. Suggested quantities are calculated from par level, minimum order quantity, and order multiple values stored in product metadata.

Managers review `suggested_order_items`, adjust `approved_quantity` when needed, and approve with `lighthouse_approve_suggested_order()`.

Approval converts the suggested order into `purchase_orders` and `purchase_order_items`. The current workflow uses mock supplier submission fields only; no Patterson integration is called from the database layer.

Receiving is recorded in `receiving_events`. Inserting a receiving event updates the matching `purchase_order_items.quantity_received`, adjusts purchase order status, and increases `inventory_levels.current_quantity`.

## Entity Relationships

`inventory_levels` belongs to one organization, facility, location, and Product Master Catalog product. Active inventory is unique by organization, product, and location.

`suggested_orders` belongs to one organization, facility, location, and vendor. Open suggested orders are unique by organization, vendor, and location while they are in review or approved status.

`suggested_order_items` belongs to one suggested order, one product, and one source inventory level. It stores quantity and cost snapshots so review screens remain stable even if catalog or inventory values later change.

`purchase_orders` reuses the existing procurement table and is extended with `organization_id`, `vendor_id`, `suggested_order_id`, `estimated_savings`, `confirmation_number`, mock submission metadata, and soft-delete support.

`purchase_order_items` reuses the existing PO line table and is extended with Product Master Catalog product links, suggested order item links, status, timestamps, metadata, and soft-delete support.

`receiving_events` belongs to one purchase order item and one product/location. It is append-only for the demo workflow and is the database event that updates inventory quantities.

## Multi-Tenant And RLS Model

The workflow tables use `organization_id` for tenant isolation. Row Level Security policies restrict records to `auth.current_user_organization_id()`.

Soft-deleted workflow rows are hidden from normal RLS reads by `deleted_at IS NULL`. The receiving table does not use soft delete because it represents inventory-affecting receipt history.

Privileged Project Lighthouse RPCs are intentionally limited to active `admin` and `manager` users in the caller's organization. `lighthouse_generate_suggested_orders()` and `lighthouse_approve_suggested_order()` use `auth.uid()` as the authoritative actor and reject spoofed `actor_id` values. Cross-tenant location IDs, suggested-order IDs, purchase-order IDs, and receiving records are rejected inside the database functions/triggers before any workflow mutation occurs.

`lighthouse_low_stock_products` is created with PostgreSQL `security_invoker` behavior so authenticated users see only rows allowed by the base table RLS policies.

Trusted `service_role` access is limited to inserting `receiving_events` for server-side receiving jobs. The receiving trigger still validates organization, facility, location, purchase order, purchase order item, product, and ordered quantity before updating inventory. The user-invoked generate and approve RPCs are granted only to `authenticated`.

## Migration Order

Apply migrations in this order:

```bash
psql $DATABASE_URL -f database/migrations/001_init_schema.sql
psql $DATABASE_URL -f database/migrations/002_product_master_catalog.sql
psql $DATABASE_URL -f database/migrations/003_project_lighthouse_ordering_workflow.sql
psql $DATABASE_URL -f database/migrations/004_project_lighthouse_security_hardening.sql
```

The ordering workflow and hardening migrations depend on:

- `organizations`, `users`, `facilities`, `departments`, `locations`, `purchase_orders`, and `purchase_order_items` from `001_init_schema.sql`
- `products`, `categories`, `vendors`, and `units_of_measure` from `002_product_master_catalog.sql`
- `auth.current_user_organization_id()` and `update_updated_at_column()` from `001_init_schema.sql`
- `003_project_lighthouse_ordering_workflow.sql` before `004_project_lighthouse_security_hardening.sql`, because the hardening migration replaces the workflow RPC definitions and low-stock view created by the ordering migration.

## Seed Process

Load the Dentira pilot seed after all four migrations:

```bash
psql $DATABASE_URL -f database/seeds/004_project_lighthouse_dentira_demo.sql
```

The seed is idempotent. It uses stable demo UUIDs, `ON CONFLICT` upserts, and existing Product Master Catalog uniqueness rules.

The seed creates:

- Dentira Dental Group demo organization and Dentira Main Office facility
- Clinical Operations department
- Four dental supply locations
- Patterson Dental as the mock vendor
- Dental supply units, categories, and product catalog rows
- Location-level `inventory_levels` with realistic par levels and reorder points

After seeding, low-stock rows are available through:

```sql
SELECT *
FROM lighthouse_low_stock_products
WHERE organization_id = 'd0000000-0000-0000-0000-000000000001';
```

Suggested orders can be generated with:

```sql
SELECT *
FROM lighthouse_generate_suggested_orders();
```

Approving a suggested order creates the purchase order and purchase order items:

```sql
SELECT lighthouse_approve_suggested_order('<suggested_order_id>');
```

Receiving a purchase order item is recorded by inserting into `receiving_events`; the trigger updates inventory automatically.

## Security Validation

Run the tenant-isolation validation after migrations and the Dentira seed:

```bash
psql $DATABASE_URL -f database/validation/005_project_lighthouse_security_validation.sql
```

The validation proves:

- User A cannot generate, approve, view, or receive Tenant B workflow records.
- Anonymous users cannot execute privileged Project Lighthouse RPCs.
- An authorized manager can generate, approve, and receive within their own organization.
- Supplied `actor_id` values do not override `auth.uid()`.
