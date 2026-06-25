# Database

Database migrations, seeds, and query definitions for VitalTrack.

## Structure

```
database/
├── migrations/          # SQL migration files
│   ├── 001_initial_schema.sql
│   ├── 002_add_audit_logs.sql
│   ├── 003_add_indexes.sql
│   └── README.md
├── seeds/               # Data seeding scripts
│   ├── 001_initial_data.sql
│   ├── 002_test_facilities.sql
│   ├── 003_demo_data.sql
│   └── seed.sh
├── queries/             # Complex SQL queries
│   ├── inventory_reports.sql
│   ├── analytics.sql
│   ├── audit_queries.sql
│   └── README.md
├── schema/              # Schema documentation
│   ├── schema.md
│   ├── ER_diagram.md
│   └── relationships.md
├── scripts/
│   ├── backup.sh        # Backup script
│   ├── restore.sh       # Restore script
│   └── maintenance.sh   # Maintenance tasks
├── .env.example         # Database connection template
└── README.md
```

## Schema Overview

### Core Tables

#### Organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Facilities
```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  facility_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Inventory Items
```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  unit_of_measure VARCHAR(50),
  track_expiration BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Stock Levels
```sql
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES facilities(id),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  available_quantity DECIMAL(10,2),
  allocated_quantity DECIMAL(10,2) DEFAULT 0,
  reserved_quantity DECIMAL(10,2) DEFAULT 0,
  min_level DECIMAL(10,2),
  max_level DECIMAL(10,2),
  reorder_level DECIMAL(10,2),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(facility_id, inventory_item_id)
);
```

#### Stock Movements
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES facilities(id),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  movement_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  created_by UUID NOT NULL REFERENCES users(id),
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);
```

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Audit Logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

## Migrations

### Running Migrations

```bash
# Apply pending migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Create new migration
npm run db:create migration_name
```

### Migration File Format

```sql
-- Migration: 001_initial_schema
-- Created: 2026-06-25
-- Description: Create initial database schema

-- Up
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Down
DROP TABLE IF EXISTS organizations;
```

## Seeds

### Running Seeds

```bash
# Seed development data
npm run db:seed

# Seed test data
npm run db:seed:test

# Seed production data (careful!)
npm run db:seed:prod
```

### Seed Structure

Seeds should be:
- Idempotent (safe to run multiple times)
- In logical order (dependencies first)
- Include test data for development

## Indexes

Key indexes for performance:

```sql
-- Stock level lookups
CREATE INDEX idx_stock_levels_facility_item 
ON stock_levels(facility_id, inventory_item_id);

-- Audit log queries
CREATE INDEX idx_audit_logs_organization_created
ON audit_logs(organization_id, created_at DESC);

-- User lookups
CREATE INDEX idx_users_organization_email
ON users(organization_id, email);

-- Stock movement queries
CREATE INDEX idx_stock_movements_facility_created
ON stock_movements(facility_id, created_at DESC);
```

## Row-Level Security (RLS)

PostgreSQL RLS policies ensure:
- Users only see their organization's data
- Facilities isolated by organization
- Audit logs filtered appropriately

```sql
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_levels_org_access ON stock_levels
  FOR ALL
  USING (facility_id IN (
    SELECT id FROM facilities WHERE organization_id = auth.uid()
  ));
```

## Backup & Recovery

### Backup

```bash
./scripts/backup.sh
```

### Restore

```bash
./scripts/restore.sh backup_file.sql
```

### Backup Schedule

- Development: On-demand
- Staging: Daily
- Production: Every 6 hours + on-demand

## Query Guidelines

### Writing Efficient Queries

1. **Use indexes**: Check `EXPLAIN ANALYZE`
2. **Limit results**: Use `LIMIT` and pagination
3. **Select needed columns**: Don't use `SELECT *`
4. **Use prepared statements**: Prevent SQL injection
5. **Join strategically**: Minimize redundant data

### Common Queries

See `queries/` directory for:
- Inventory reports
- Analytics queries
- Audit queries
- Performance queries

## Development

```bash
# Start local PostgreSQL
docker run -d -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15

# Connect via psql
psql postgresql://postgres:password@localhost:5432/vitaltrack

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

## Monitoring

Key metrics:
- Query performance (slow query log)
- Connection pool usage
- Backup success/failure
- Storage growth
- Lock contention

See operations guide for monitoring setup.
