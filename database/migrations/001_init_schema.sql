-- VitalTrack Platform - Initial Schema
-- Created: 2026-06-25
-- Purpose: Core tables for multi-tenant healthcare inventory management

-- ============================================================================
-- Organizations (Tenants)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  tier VARCHAR(50) DEFAULT 'standard', -- standard, professional, enterprise
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);

-- ============================================================================
-- Users (Multi-tenant Users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'staff', -- admin, manager, staff, viewer, auditor
  is_active BOOLEAN DEFAULT TRUE,
  phone VARCHAR(20),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  last_login TIMESTAMP,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================================
-- Facilities (Multi-location Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(50), -- hospital, clinic, pharmacy, warehouse, etc.
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facilities_organization_id ON facilities(organization_id);
CREATE INDEX idx_facilities_facility_type ON facilities(facility_type);
CREATE INDEX idx_facilities_is_active ON facilities(is_active);

-- ============================================================================
-- Departments/Units (Within Facilities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  department_code VARCHAR(50),
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_facility_id ON departments(facility_id);
CREATE INDEX idx_departments_is_active ON departments(is_active);

-- ============================================================================
-- Storage Locations (Hierarchical)
-- ============================================================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  location_code VARCHAR(50),
  location_type VARCHAR(50), -- floor, wing, room, cabinet, shelf, bin
  parent_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  capacity_units INT,
  current_utilization INT DEFAULT 0,
  temperature_controlled BOOLEAN DEFAULT FALSE,
  barcode VARCHAR(255) UNIQUE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_facility_id ON locations(facility_id);
CREATE INDEX idx_locations_department_id ON locations(department_id);
CREATE INDEX idx_locations_parent_location_id ON locations(parent_location_id);
CREATE INDEX idx_locations_location_code ON locations(location_code);

-- ============================================================================
-- Inventory Items (Products/SKUs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  description TEXT,
  uom VARCHAR(50) DEFAULT 'unit', -- unit, box, case, pallet, etc.
  unit_cost DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  supplier_id UUID,
  manufacturer VARCHAR(255),
  model_number VARCHAR(100),
  track_expiration BOOLEAN DEFAULT TRUE,
  expiration_alert_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, sku)
);

CREATE INDEX idx_inventory_items_organization_id ON inventory_items(organization_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);

-- ============================================================================
-- Stock Levels (Real-time Inventory)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  available_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
  allocated_quantity DECIMAL(12, 2) DEFAULT 0,
  reserved_quantity DECIMAL(12, 2) DEFAULT 0,
  min_level DECIMAL(12, 2) DEFAULT 0,
  max_level DECIMAL(12, 2) DEFAULT 0,
  reorder_level DECIMAL(12, 2) DEFAULT 0,
  reorder_quantity DECIMAL(12, 2) DEFAULT 0,
  lead_time_days INT DEFAULT 7,
  last_counted TIMESTAMP,
  last_ordered TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(facility_id, inventory_item_id, location_id)
);

CREATE INDEX idx_stock_levels_facility_item ON stock_levels(facility_id, inventory_item_id);
CREATE INDEX idx_stock_levels_location_id ON stock_levels(location_id);
CREATE INDEX idx_stock_levels_updated_at ON stock_levels(updated_at DESC);

-- ============================================================================
-- Stock Movements (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  movement_type VARCHAR(50) NOT NULL, -- receive, consume, transfer, adjust, waste, return
  quantity DECIMAL(12, 2) NOT NULL,
  uom VARCHAR(50),
  reason VARCHAR(255),
  reference_number VARCHAR(100),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_facility_id ON stock_movements(facility_id);
CREATE INDEX idx_stock_movements_inventory_item_id ON stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_by ON stock_movements(created_by);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_facility_created ON stock_movements(facility_id, created_at DESC);

-- ============================================================================
-- Stock Expiration Tracking (Lot/Batch Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  lot_number VARCHAR(100),
  batch_number VARCHAR(100),
  manufacture_date DATE,
  expiration_date DATE,
  quantity_received DECIMAL(12, 2),
  quantity_available DECIMAL(12, 2),
  quantity_expired DECIMAL(12, 2) DEFAULT 0,
  received_date TIMESTAMP,
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  supplier_id UUID,
  cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(facility_id, inventory_item_id, lot_number)
);

CREATE INDEX idx_stock_lots_facility_item ON stock_lots(facility_id, inventory_item_id);
CREATE INDEX idx_stock_lots_expiration_date ON stock_lots(expiration_date);
CREATE INDEX idx_stock_lots_location_id ON stock_lots(location_id);

-- ============================================================================
-- Suppliers
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  supplier_code VARCHAR(50),
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  website TEXT,
  payment_terms VARCHAR(100),
  lead_time_days INT DEFAULT 7,
  minimum_order_quantity DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_organization_id ON suppliers(organization_id);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);

-- ============================================================================
-- Purchase Orders (Reordering)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  po_number VARCHAR(100) NOT NULL UNIQUE,
  po_date TIMESTAMP NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, confirmed, shipped, received, cancelled
  total_amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_orders_facility_id ON purchase_orders(facility_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders(created_at DESC);

-- ============================================================================
-- Purchase Order Items
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_ordered DECIMAL(12, 2),
  quantity_received DECIMAL(12, 2) DEFAULT 0,
  unit_price DECIMAL(10, 2),
  line_total DECIMAL(12, 2),
  uom VARCHAR(50),
  notes TEXT
);

CREATE INDEX idx_po_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_inventory_item_id ON purchase_order_items(inventory_item_id);

-- ============================================================================
-- Audit Logs (Compliance & Regulatory)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- create, update, delete, view, export, login, etc.
  resource_type VARCHAR(100), -- inventory_item, stock_level, purchase_order, etc.
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success', -- success, failure
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);

-- ============================================================================
-- Alerts & Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- low_stock, expiring_soon, out_of_stock, critical, quality_issue
  severity VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
  title VARCHAR(255) NOT NULL,
  description TEXT,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  stock_level_id UUID REFERENCES stock_levels(id) ON DELETE CASCADE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX idx_alerts_facility_id ON alerts(facility_id);
CREATE INDEX idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ============================================================================
-- Reorder Rules (Automation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reorder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  min_quantity DECIMAL(12, 2),
  max_quantity DECIMAL(12, 2),
  reorder_quantity DECIMAL(12, 2),
  lead_time_days INT DEFAULT 7,
  is_active BOOLEAN DEFAULT TRUE,
  auto_order BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(facility_id, inventory_item_id)
);

CREATE INDEX idx_reorder_rules_facility_item ON reorder_rules(facility_id, inventory_item_id);
CREATE INDEX idx_reorder_rules_is_active ON reorder_rules(is_active);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view/edit own organization data
CREATE POLICY users_own_org
  ON users
  FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY facilities_own_org
  ON facilities
  FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY inventory_items_own_org
  ON inventory_items
  FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY stock_levels_own_org
  ON stock_levels
  FOR ALL
  USING (facility_id IN (SELECT f.id FROM facilities f WHERE f.organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY stock_movements_own_org
  ON stock_movements
  FOR ALL
  USING (facility_id IN (SELECT f.id FROM facilities f WHERE f.organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY stock_lots_own_org
  ON stock_lots
  FOR ALL
  USING (facility_id IN (SELECT f.id FROM facilities f WHERE f.organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY suppliers_own_org
  ON suppliers
  FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY purchase_orders_own_org
  ON purchase_orders
  FOR ALL
  USING (facility_id IN (SELECT f.id FROM facilities f WHERE f.organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY purchase_order_items_own_org
  ON purchase_order_items
  FOR ALL
  USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE facility_id IN (SELECT f.id FROM facilities f WHERE f.organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()))));

CREATE POLICY audit_logs_own_org
  ON audit_logs
  FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY alerts_own_org
  ON alerts
  FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY departments_own_org
  ON departments
  FOR ALL
  USING (facility_id IN (SELECT f.id FROM facilities f WHERE f.organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY locations_own_org
  ON locations
  FOR ALL
  USING (facility_id IN (SELECT f.id FROM facilities f WHERE f.organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY reorder_rules_own_org
  ON reorder_rules
  FOR ALL
  USING (facility_id IN (SELECT f.id FROM facilities f WHERE f.organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Organizations table: Only admins can view/edit
CREATE POLICY organizations_admin_only
  ON organizations
  FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- Triggers (Automatic Timestamp Updates)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reorder_rules_updated_at
  BEFORE UPDATE ON reorder_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
