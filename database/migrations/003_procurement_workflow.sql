-- Migration: 003_procurement_workflow
-- Created: 2026-07-09
-- Description: Suggested-order workflow tables for Project Lighthouse.
--
-- Workflow: Low Stock Detection → Suggested Order → Review → Approve → Purchase Confirmation
--
-- A suggested_order is auto-generated from stock-level analysis. A staff member
-- reviews the line items, then approves the order. Approval mocks a submission to
-- the supplier (e.g. Patterson Dental) and creates a formal purchase_order record.

-- ============================================================================
-- Suggested Orders  (pre-approval order headers)
-- ============================================================================
--
-- Status lifecycle:
--   pending_review  → staff can review and edit quantities
--   approved        → internal sign-off (currently merged with submitted in the demo)
--   submitted       → mock-submitted to the supplier, purchase_order created
--   rejected        → discarded without ordering

CREATE TABLE IF NOT EXISTS suggested_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
  total_estimated_cost DECIMAL(12, 2),
  -- Timestamps for each lifecycle step
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  submitted_at TIMESTAMP,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Linked purchase order created on approval
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT suggested_orders_status_valid CHECK (
    status IN ('pending_review', 'approved', 'submitted', 'rejected')
  )
);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_organization_id
  ON suggested_orders (organization_id);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_facility_id
  ON suggested_orders (facility_id);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_status
  ON suggested_orders (status);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_supplier_id
  ON suggested_orders (supplier_id);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_created_at
  ON suggested_orders (created_at DESC);

-- ============================================================================
-- Suggested Order Items  (line items for a suggested order)
-- ============================================================================
--
-- quantity_suggested is auto-calculated from the reorder rule.
-- quantity_approved may be edited during review before approval.

CREATE TABLE IF NOT EXISTS suggested_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_order_id UUID NOT NULL REFERENCES suggested_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_suggested DECIMAL(12, 2) NOT NULL DEFAULT 0,
  quantity_approved DECIMAL(12, 2),
  unit_price DECIMAL(10, 2),
  line_total DECIMAL(12, 2),
  uom VARCHAR(50),
  notes TEXT,
  CONSTRAINT suggested_order_items_order_item_unique
    UNIQUE (suggested_order_id, inventory_item_id),
  CONSTRAINT suggested_order_items_quantity_nonneg
    CHECK (quantity_suggested >= 0)
);

CREATE INDEX IF NOT EXISTS idx_suggested_order_items_order_id
  ON suggested_order_items (suggested_order_id);

CREATE INDEX IF NOT EXISTS idx_suggested_order_items_inventory_item_id
  ON suggested_order_items (inventory_item_id);

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================
--
-- Same pattern as existing tables:
-- suggested_orders have organization_id directly → simple org check.
-- suggested_order_items link through suggested_orders → subquery.

ALTER TABLE suggested_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY suggested_orders_own_org
  ON suggested_orders
  FOR ALL
  USING (organization_id = auth.current_user_organization_id())
  WITH CHECK (organization_id = auth.current_user_organization_id());

CREATE POLICY suggested_order_items_own_org
  ON suggested_order_items
  FOR ALL
  USING (
    suggested_order_id IN (
      SELECT id FROM suggested_orders
      WHERE organization_id = auth.current_user_organization_id()
    )
  )
  WITH CHECK (
    suggested_order_id IN (
      SELECT id FROM suggested_orders
      WHERE organization_id = auth.current_user_organization_id()
    )
  );

-- ============================================================================
-- Triggers (Automatic Timestamp Updates)
-- ============================================================================
--
-- Reuses update_updated_at_column() defined in migration 001.

CREATE TRIGGER update_suggested_orders_updated_at
  BEFORE UPDATE ON suggested_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
