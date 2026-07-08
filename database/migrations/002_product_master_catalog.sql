-- Migration: 002_product_master_catalog
-- Created: 2026-07-08
-- Description: Normalized product master catalog tables for Supabase/PostgreSQL

-- ============================================================================
-- Categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_category_id UUID,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  category_code VARCHAR(50),
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_id_organization_unique UNIQUE (id, organization_id),
  CONSTRAINT categories_org_slug_unique UNIQUE (organization_id, slug),
  CONSTRAINT categories_org_code_unique UNIQUE (organization_id, category_code),
  CONSTRAINT categories_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT categories_slug_not_blank CHECK (btrim(slug) <> ''),
  CONSTRAINT categories_not_own_parent CHECK (parent_category_id IS NULL OR parent_category_id <> id),
  CONSTRAINT categories_parent_fk
    FOREIGN KEY (parent_category_id, organization_id)
    REFERENCES categories(id, organization_id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_org_root_name
  ON categories (organization_id, lower(name))
  WHERE parent_category_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_org_parent_name
  ON categories (organization_id, parent_category_id, lower(name))
  WHERE parent_category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_organization_id
  ON categories (organization_id);

CREATE INDEX IF NOT EXISTS idx_categories_parent_category_id
  ON categories (parent_category_id);

CREATE INDEX IF NOT EXISTS idx_categories_is_active
  ON categories (is_active);

CREATE INDEX IF NOT EXISTS idx_categories_org_sort_order
  ON categories (organization_id, sort_order, name);

-- ============================================================================
-- Manufacturers
-- ============================================================================

CREATE TABLE IF NOT EXISTS manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  manufacturer_code VARCHAR(50),
  website TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  country VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT manufacturers_id_organization_unique UNIQUE (id, organization_id),
  CONSTRAINT manufacturers_org_code_unique UNIQUE (organization_id, manufacturer_code),
  CONSTRAINT manufacturers_name_not_blank CHECK (btrim(name) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_manufacturers_org_name
  ON manufacturers (organization_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_manufacturers_organization_id
  ON manufacturers (organization_id);

CREATE INDEX IF NOT EXISTS idx_manufacturers_is_active
  ON manufacturers (is_active);

-- ============================================================================
-- Vendors
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(50),
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  website TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  payment_terms VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vendors_id_organization_unique UNIQUE (id, organization_id),
  CONSTRAINT vendors_org_code_unique UNIQUE (organization_id, vendor_code),
  CONSTRAINT vendors_name_not_blank CHECK (btrim(name) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_org_name
  ON vendors (organization_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_vendors_organization_id
  ON vendors (organization_id);

CREATE INDEX IF NOT EXISTS idx_vendors_is_active
  ON vendors (is_active);

-- ============================================================================
-- Units of Measure
-- ============================================================================

CREATE TABLE IF NOT EXISTS units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  base_unit_id UUID,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  dimension VARCHAR(30) NOT NULL DEFAULT 'count',
  allows_decimal BOOLEAN NOT NULL DEFAULT FALSE,
  is_base_unit BOOLEAN NOT NULL DEFAULT TRUE,
  conversion_factor NUMERIC(18, 6) NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT units_of_measure_id_organization_unique UNIQUE (id, organization_id),
  CONSTRAINT units_of_measure_org_code_unique UNIQUE (organization_id, code),
  CONSTRAINT units_of_measure_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT units_of_measure_code_not_blank CHECK (btrim(code) <> ''),
  CONSTRAINT units_of_measure_dimension_valid CHECK (
    dimension IN ('count', 'length', 'area', 'volume', 'mass', 'time', 'temperature', 'other')
  ),
  CONSTRAINT units_of_measure_conversion_positive CHECK (conversion_factor > 0),
  CONSTRAINT units_of_measure_not_own_base CHECK (base_unit_id IS NULL OR base_unit_id <> id),
  CONSTRAINT units_of_measure_base_rules CHECK (
    (is_base_unit = TRUE AND base_unit_id IS NULL AND conversion_factor = 1)
    OR (is_base_unit = FALSE AND base_unit_id IS NOT NULL)
  ),
  CONSTRAINT units_of_measure_base_fk
    FOREIGN KEY (base_unit_id, organization_id)
    REFERENCES units_of_measure(id, organization_id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_of_measure_org_name
  ON units_of_measure (organization_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_units_of_measure_organization_id
  ON units_of_measure (organization_id);

CREATE INDEX IF NOT EXISTS idx_units_of_measure_base_unit_id
  ON units_of_measure (base_unit_id);

CREATE INDEX IF NOT EXISTS idx_units_of_measure_dimension
  ON units_of_measure (dimension);

CREATE INDEX IF NOT EXISTS idx_units_of_measure_is_active
  ON units_of_measure (is_active);

-- ============================================================================
-- Products
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL,
  manufacturer_id UUID,
  unit_of_measure_id UUID NOT NULL,
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  gtin VARCHAR(14),
  manufacturer_part_number VARCHAR(100),
  brand_name VARCHAR(255),
  product_type VARCHAR(50) NOT NULL DEFAULT 'supply',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  requires_lot_tracking BOOLEAN NOT NULL DEFAULT FALSE,
  requires_serial_tracking BOOLEAN NOT NULL DEFAULT FALSE,
  requires_expiration_tracking BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT products_id_organization_unique UNIQUE (id, organization_id),
  CONSTRAINT products_org_sku_unique UNIQUE (organization_id, sku),
  CONSTRAINT products_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT products_sku_not_blank CHECK (btrim(sku) <> ''),
  CONSTRAINT products_product_type_valid CHECK (
    product_type IN ('medication', 'supply', 'equipment', 'consumable', 'service', 'other')
  ),
  CONSTRAINT products_status_valid CHECK (
    status IN ('draft', 'active', 'inactive', 'discontinued')
  ),
  CONSTRAINT products_category_fk
    FOREIGN KEY (category_id, organization_id)
    REFERENCES categories(id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT products_manufacturer_fk
    FOREIGN KEY (manufacturer_id, organization_id)
    REFERENCES manufacturers(id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT products_unit_of_measure_fk
    FOREIGN KEY (unit_of_measure_id, organization_id)
    REFERENCES units_of_measure(id, organization_id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_org_gtin
  ON products (organization_id, gtin)
  WHERE gtin IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_org_manufacturer_part_number
  ON products (organization_id, manufacturer_id, manufacturer_part_number)
  WHERE manufacturer_part_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_organization_id
  ON products (organization_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id
  ON products (manufacturer_id);

CREATE INDEX IF NOT EXISTS idx_products_unit_of_measure_id
  ON products (unit_of_measure_id);

CREATE INDEX IF NOT EXISTS idx_products_status
  ON products (status);

CREATE INDEX IF NOT EXISTS idx_products_is_active
  ON products (is_active);

CREATE INDEX IF NOT EXISTS idx_products_org_name
  ON products (organization_id, lower(name));

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_own_org
  ON categories
  FOR ALL
  USING (organization_id = auth.current_user_organization_id())
  WITH CHECK (organization_id = auth.current_user_organization_id());

CREATE POLICY manufacturers_own_org
  ON manufacturers
  FOR ALL
  USING (organization_id = auth.current_user_organization_id())
  WITH CHECK (organization_id = auth.current_user_organization_id());

CREATE POLICY vendors_own_org
  ON vendors
  FOR ALL
  USING (organization_id = auth.current_user_organization_id())
  WITH CHECK (organization_id = auth.current_user_organization_id());

CREATE POLICY units_of_measure_own_org
  ON units_of_measure
  FOR ALL
  USING (organization_id = auth.current_user_organization_id())
  WITH CHECK (organization_id = auth.current_user_organization_id());

CREATE POLICY products_own_org
  ON products
  FOR ALL
  USING (organization_id = auth.current_user_organization_id())
  WITH CHECK (organization_id = auth.current_user_organization_id());

-- ============================================================================
-- Triggers (Automatic Timestamp Updates)
-- ============================================================================

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manufacturers_updated_at
  BEFORE UPDATE ON manufacturers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_of_measure_updated_at
  BEFORE UPDATE ON units_of_measure
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
