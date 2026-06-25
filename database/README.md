# Database

PostgreSQL database migrations, seeds, and query definitions for VitalTrack—healthcare inventory management for enterprise SaaS.

## Structure

```
database/
├── migrations/              # SQL migration files (versioned)
│   └── 001_init_schema.sql  # Core tables, indexes, RLS, triggers
├── seeds/                   # Development & test data
│   └── 002_seed_data.sql    # Sample orgs, facilities, inventory, stock
├── queries/                 # Complex analytical queries
│   └── common_queries.sql   # Inventory, PO, audit, operational metrics
└── README.md
```

## Quick Start

### 1. Apply Schema

```bash
# Via Supabase CLI
supabase db push

# Via psql
psql $DATABASE_URL < database/migrations/001_init_schema.sql
```

### 2. Load Test Data

```bash
psql $DATABASE_URL < database/seeds/002_seed_data.sql
```

### 3. Query Analytics

```bash
# Example: Low stock items
psql $DATABASE_URL -f database/queries/common_queries.sql
```

## Schema Overview

### Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                   ORGANIZATIONS (Tenants)                        │
│  id | name | slug | tier | status | created_at | updated_at     │
└────────────┬──────────────────────────────────────────────────────┘
             │ (1:N - Multi-tenant isolation root)
    ┌────────┼────────────────┬──────────────────┬──────────────┐
    ▼        ▼                ▼                  ▼              ▼
  USERS   FACILITIES    INVENTORY_ITEMS    SUPPLIERS        ALERTS
  (auth)  (hospitals,   (SKUs, products,  (vendors,
           clinics)     medications)      distributors)
    │        │               │                  │              │
    │     ┌──┼─┐             │              ┌───┘              │
    ▼     ▼  ▼  ▼            ▼              ▼                  ▼
  AUDIT  DEPT STOCK      STOCK_LEVELS    PURCHASE_ORDERS   (notif)
  LOGS   MENT MOVEMENTS   (per facility,  (reordering,      │
         (units)          per item)       POs, line items)   │
                                │         │                  │
                ┌───────────────┼─────────┘                  │
                ▼               ▼                            │
            LOCATIONS       STOCK_LOTS              REORDER_RULES
            (hierarchical:  (lot/batch,            (automation
             floor→wing→     expiry tracking,      triggers)
             room→cabinet    FIFO management)
             →shelf)
```

### Core Tables & Purpose

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **organizations** | Tenant separation (multi-tenant SaaS) | id, name, slug, tier, status |
| **users** | Authentication & authorization | id (auth.uid), organization_id, role, email |
| **facilities** | Hospitals, clinics, warehouses | id, organization_id, name, facility_type, address |
| **departments** | Units within facilities (ED, OR, ICU) | id, facility_id, name, manager_id |
| **locations** | Hierarchical storage (floor→room→cabinet→shelf) | id, facility_id, parent_location_id, location_type |
| **inventory_items** | Products/SKUs (medications, supplies) | id, organization_id, sku, name, category, unit_cost, track_expiration |
| **stock_levels** | Real-time inventory per facility/item | id, facility_id, inventory_item_id, available_quantity, min_level, max_level |
| **stock_movements** | Audit trail of all stock changes | id, facility_id, movement_type, quantity, created_by, reason |
| **stock_lots** | Batch/lot tracking for expiration | id, facility_id, lot_number, expiration_date, quantity_available |
| **suppliers** | Vendor master data | id, organization_id, name, lead_time_days |
| **purchase_orders** | Procurement workflow | id, facility_id, supplier_id, po_number, status, total_amount |
| **purchase_order_items** | Line items in POs | id, purchase_order_id, inventory_item_id, quantity_ordered, unit_price |
| **audit_logs** | Compliance & regulatory tracking | id, organization_id, user_id, action, old_values, new_values, created_at |
| **alerts** | Notifications (low stock, expiring) | id, organization_id, alert_type, severity, is_resolved |
| **reorder_rules** | Auto-ordering automation | id, facility_id, inventory_item_id, min_quantity, max_quantity, auto_order |

### Key Design Patterns

**Multi-Tenancy**
- All tables reference `organization_id` (except system tables)
- RLS policies enforce organization isolation
- Users see only their organization's data

**Hierarchical Locations**
- Parent-child structure for realistic facility layouts
- `parent_location_id` enables floor → wing → room → cabinet → shelf
- Enables location-aware inventory queries

**Lot/Batch Tracking**
- Separate `stock_lots` table (FIFO management, expiration)
- Tracks manufacture_date, expiration_date, lot_number
- Critical for pharmaceutical/perishable inventory compliance

**Audit Trail**
- `stock_movements` captures every change with reason
- `audit_logs` for compliance (old_values, new_values as JSONB)
- User attribution (created_by) for accountability

**Reordering Workflow**
- `stock_levels` tracks min/max/reorder thresholds
- `reorder_rules` enables automation
- `purchase_orders` + `purchase_order_items` for procurement

## Migrations

### Current Migrations

- **001_init_schema.sql** - Complete initial schema with:
  - 15 core tables (organizations, users, facilities, departments, locations, inventory_items, stock_levels, stock_movements, stock_lots, suppliers, purchase_orders, purchase_order_items, audit_logs, alerts, reorder_rules)
  - 30+ indexes optimized for queries
  - RLS policies enforcing multi-tenant isolation
  - Auto-update triggers for `updated_at` timestamps

### Applying Migrations

```bash
# Via Supabase CLI (recommended for cloud)
supabase db push

# Via psql (local or remote)
psql $DATABASE_URL -f database/migrations/001_init_schema.sql

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM pg_tables WHERE schemaname = 'public';"
```

### Adding New Migrations

For future schema changes:

```bash
# Create migration file following naming: NNN_description.sql
touch database/migrations/002_add_feature.sql

# Template
cat > database/migrations/002_add_feature.sql <<'EOF'
-- Migration: 002_add_feature
-- Created: $(date +%Y-%m-%d)
-- Description: [Your description]

-- Add your CREATE/ALTER/DROP statements here

EOF
```

## Seeds

### Sample Data Included

**002_seed_data.sql** includes realistic test data:

**Organizations (3)**
- Metropolitan Hospital Group (enterprise tier)
- Urban Clinic Network (professional tier)
- Central Pharmacy (professional tier)

**Facilities (4)**
- Metro Central Hospital + Metro North Clinic
- Urban Downtown Clinic
- Central Warehouse

**Departments (4)**
- Emergency Department
- Surgical Operations
- Hospital Pharmacy
- Intensive Care Unit

**Inventory Items (10)**
- Medications: Aspirin, Amoxicillin, Insulin
- Supplies: Gauze, Bandages, Syringes, IV Catheters
- PPE: Masks, Gloves
- Equipment: Blood Pressure Monitor

**Stock with Reorder Rules**
- Pre-configured min/max/reorder levels
- Auto-order flags for critical items
- Lead time and supplier associations

**Purchase Orders (3)**
- Mix of draft, submitted, and shipped status
- Sample line items and totals

**Stock Lots**
- Expiration tracking for medications
- Batch/lot numbers for traceability

### Loading Seeds

```bash
# Load development data
psql $DATABASE_URL -f database/seeds/002_seed_data.sql

# Verify data loaded
psql $DATABASE_URL -c "SELECT COUNT(*) as org_count FROM organizations;"
psql $DATABASE_URL -c "SELECT COUNT(*) as item_count FROM inventory_items;"
psql $DATABASE_URL -c "SELECT COUNT(*) as stock_count FROM stock_levels;"
```

### Seed Structure

Seeds are designed to be:
- **Idempotent** - Can re-run without conflicts (uses real UUIDs)
- **Realistic** - Data mirrors production scenarios
- **Complete** - Includes cross-table relationships
- **Testable** - Easy to verify with sample queries

## Indexes

**30+ indexes created in 001_init_schema.sql** optimized for:

- **Organization/Tenant filtering** (`organization_id`)
- **Facility lookups** (`facility_id`)
- **Stock queries** (`facility_id, inventory_item_id`, `created_at DESC`)
- **User lookups** (`organization_id, email`)
- **Audit trails** (`organization_id`, `action`, `resource_type`, `created_at DESC`)
- **Expiration tracking** (`expiration_date` on stock_lots)
- **Status filtering** (`status`, `is_active`, `is_resolved`)

Example query with index benefit:

```sql
-- Uses idx_stock_levels_facility_item (composite)
SELECT * FROM stock_levels 
WHERE facility_id = $1 AND inventory_item_id = $2;

-- Uses idx_stock_movements_facility_created (DESC for ORDER BY)
SELECT * FROM stock_movements 
WHERE facility_id = $1 
ORDER BY created_at DESC 
LIMIT 100;
```

Use `EXPLAIN ANALYZE` to verify index usage:

```bash
psql $DATABASE_URL
\d stock_levels
EXPLAIN ANALYZE SELECT * FROM stock_levels WHERE facility_id = 'f1...';
```

## Row-Level Security (RLS)

**Critical Security Pattern:** All queries automatically filtered to authenticated user's organization.

### RLS Policies in 001_init_schema.sql

All 15 tables have RLS enabled with policies like:

```sql
-- Users see only data from their organization
CREATE POLICY users_own_org ON users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Stock levels filtered via facility → organization
CREATE POLICY stock_levels_own_org ON stock_levels
  FOR ALL USING (
    facility_id IN (
      SELECT f.id FROM facilities f 
      WHERE f.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

### How It Works

1. User authenticates → `auth.uid()` set
2. Every query to any table auto-filtered by RLS policy
3. User sees only their organization's data
4. Prevents cross-tenant data leaks at database level
5. Reduces application complexity (no manual org_id checks needed)

### Testing RLS

```bash
# Set auth context (Supabase CLI)
supabase start

# Run as specific user
psql $DATABASE_URL -c "SELECT auth.uid();"

# Verify filtering
SELECT * FROM inventory_items;  -- Only returns org items
```


## Local Development

### Setup

```bash
# Start local PostgreSQL (Docker)
docker run -d \
  --name vitaltrack-db \
  -e POSTGRES_DB=vitaltrack \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Create .env for connection
cat > .env.local <<EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/vitaltrack
EOF

# Apply schema
psql postgresql://postgres:password@localhost:5432/vitaltrack \
  -f database/migrations/001_init_schema.sql

# Load test data
psql postgresql://postgres:password@localhost:5432/vitaltrack \
  -f database/seeds/002_seed_data.sql

# Verify (should show 15 tables)
psql postgresql://postgres:password@localhost:5432/vitaltrack \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

### Interactive Queries

```bash
# Open psql shell
psql $DATABASE_URL

# Useful commands
\d                          # List all tables
\d table_name               # Describe table
\di                         # List indexes
SELECT * FROM organizations; -- Query data
\x on                       # Expanded output mode
\timing on                  # Show query execution time
```

## Query Guidelines & Common Analytics

### Pre-Built Analytical Queries

**database/queries/common_queries.sql** includes ready-to-use queries:

| Query | Purpose |
|-------|---------|
| Low Stock Alert | Items below minimum threshold needing reorder |
| Expiring Soon | Lots expiring within 30 days (compliance) |
| Stock Value Report | Total inventory value by category |
| Usage Rate Analysis | Item consumption rates over 30 days |
| PO Status Summary | Purchase order pipeline overview |
| Outstanding POs | Pending deliveries and their status |
| Supplier Performance | On-time delivery %, order value analytics |
| Stock Discrepancies | Waste/adjustment ratio detection |
| Audit Trail | User actions and changes (compliance) |
| Facility Snapshot | Real-time inventory status per location |
| Reorder Recommendations | Items ready to auto-order |

### Running Queries

```bash
# Execute low stock query (parameterized)
psql $DATABASE_URL << SQL
SELECT * FROM stock_levels sl
JOIN inventory_items ii ON sl.inventory_item_id = ii.id
WHERE sl.available_quantity <= sl.min_level
AND sl.facility_id = 'f1000000-0000-0000-0000-000000000001'
ORDER BY (sl.min_level - sl.available_quantity) DESC;
SQL

# Run all analytics
psql $DATABASE_URL -f database/queries/common_queries.sql
```

### Writing Efficient Queries

1. **Use indexes**: Run `EXPLAIN ANALYZE` to verify index usage
2. **Limit results**: Always use `LIMIT` and pagination for large sets
3. **Select columns**: Don't use `SELECT *` — specify needed columns
4. **Parameterize**: Use `$1, $2` not string interpolation
5. **Join efficiently**: Filter early, aggregate late


## Deployment

### Supabase Cloud Deployment

```bash
# Link to remote Supabase project
supabase link --project-ref <project-ref>

# Push schema to cloud
supabase db push

# Verify migrations applied
supabase migration list

# Pull latest schema from cloud
supabase db pull
```

### Environment Variables

Set in `.env` or deployment platform:

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Server-side only

# PostgreSQL direct
DATABASE_URL=postgresql://user:pass@host:5432/vitaltrack
```

## Monitoring & Maintenance

### Key Metrics

- **Query performance** - Monitor slow queries (> 1s)
- **Connection pool** - Avoid max connection exhaustion
- **Backup status** - Verify daily backups succeed
- **Storage growth** - Track table sizes monthly
- **Lock contention** - Check for blocking queries

### Performance Tuning

```bash
# Find slow queries
psql $DATABASE_URL -c "SELECT query, calls, mean_time FROM pg_stat_statements 
WHERE mean_time > 1000 ORDER BY mean_time DESC LIMIT 10;"

# Analyze table
ANALYZE inventory_items;

# Check index bloat
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

## Next Steps & Future Enhancements

**For Series A Readiness:**

- [ ] Implement database audit logging triggers (auto-populate `audit_logs`)
- [ ] Add alerts system triggers (auto-create alerts for low stock)
- [ ] Create reorder workflow automation (auto-generate purchase orders)
- [ ] Build read-only analytics replica for reporting
- [ ] Set up automated backups (Supabase or pg_dump)
- [ ] Implement connection pooling (PgBouncer)
- [ ] Add database change notifications (LISTEN/NOTIFY)
- [ ] Create stored procedures for complex workflows

**Scalability:**

- [ ] Implement table partitioning (audit_logs by month)
- [ ] Add materialized views for dashboards
- [ ] Cache hot queries with Redis
- [ ] Consider read replicas for analytics workload

## Support & Troubleshooting

**Common Issues:**

| Issue | Solution |
|-------|----------|
| RLS "permission denied" | Verify `auth.uid()` set; check policy using `SELECT * FROM pg_policies;` |
| Connection timeout | Check connection string; verify firewall allows PostgreSQL |
| Slow queries | Run `EXPLAIN ANALYZE` and check if indexes are used |
| Out of disk space | Check `SELECT pg_size_pretty(pg_database_size('vitaltrack'));` |

**Helpful Commands:**

```bash
# Analyze current schema
psql $DATABASE_URL -c "\d+"

# Check RLS policies
psql $DATABASE_URL -c "SELECT * FROM pg_policies;"

# Monitor connections
psql $DATABASE_URL -c "SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;"

# Reset sequences
psql $DATABASE_URL -c "SELECT setval(pg_get_serial_sequence('table_name', 'id'), MAX(id)) FROM table_name;"
```

**Documentation:**

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [VitalTrack Product Spec](../PRODUCT_SPEC.md)
- [Database Design](../DESIGN_DOC.md) (coming soon)
