-- Migration: 003_project_lighthouse_ordering_workflow
-- Created: 2026-07-09
-- Description: Project Lighthouse ordering workflow for the Dentira demo

-- This layer builds on the existing tenant schema and Product Master Catalog.
-- It intentionally does not replace catalog tables. The existing `locations`,
-- `purchase_orders`, and `purchase_order_items` tables are extended/reused.

BEGIN;

-- ============================================================================
-- Inventory Levels
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  current_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
  par_level DECIMAL(12, 2) NOT NULL,
  reorder_point DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) GENERATED ALWAYS AS (
    CASE
      WHEN current_quantity <= reorder_point THEN 'low_stock'
      WHEN current_quantity < par_level THEN 'below_par'
      ELSE 'in_stock'
    END
  ) STORED,
  last_counted_at TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT inventory_levels_product_fk
    FOREIGN KEY (product_id, organization_id)
    REFERENCES products(id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT inventory_levels_current_quantity_nonnegative CHECK (current_quantity >= 0),
  CONSTRAINT inventory_levels_par_positive CHECK (par_level > 0),
  CONSTRAINT inventory_levels_reorder_nonnegative CHECK (reorder_point >= 0),
  CONSTRAINT inventory_levels_par_above_reorder CHECK (par_level >= reorder_point)
);

CREATE INDEX IF NOT EXISTS idx_inventory_levels_organization_id
  ON inventory_levels (organization_id);

CREATE INDEX IF NOT EXISTS idx_inventory_levels_facility_id
  ON inventory_levels (facility_id);

CREATE INDEX IF NOT EXISTS idx_inventory_levels_location_id
  ON inventory_levels (location_id);

CREATE INDEX IF NOT EXISTS idx_inventory_levels_product_id
  ON inventory_levels (product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_levels_status
  ON inventory_levels (status);

CREATE INDEX IF NOT EXISTS idx_inventory_levels_low_stock
  ON inventory_levels (organization_id, facility_id, location_id, status)
  WHERE status = 'low_stock' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_levels_active_product_location
  ON inventory_levels (organization_id, product_id, location_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_levels_deleted_at
  ON inventory_levels (deleted_at);

-- ============================================================================
-- Suggested Orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS suggested_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'review',
  suggested_subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estimated_savings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  source_note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT suggested_orders_vendor_fk
    FOREIGN KEY (vendor_id, organization_id)
    REFERENCES vendors(id, organization_id)
    ON DELETE NO ACTION,
  CONSTRAINT suggested_orders_status_valid CHECK (
    status IN ('review', 'approved', 'converted', 'cancelled')
  ),
  CONSTRAINT suggested_orders_subtotal_nonnegative CHECK (suggested_subtotal >= 0),
  CONSTRAINT suggested_orders_savings_nonnegative CHECK (estimated_savings >= 0),
  CONSTRAINT suggested_orders_approval_required CHECK (
    status NOT IN ('approved', 'converted')
    OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suggested_orders_open_vendor_location
  ON suggested_orders (organization_id, vendor_id, location_id)
  WHERE status IN ('review', 'approved') AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_suggested_orders_organization_id
  ON suggested_orders (organization_id);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_facility_id
  ON suggested_orders (facility_id);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_location_id
  ON suggested_orders (location_id);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_vendor_id
  ON suggested_orders (vendor_id);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_status
  ON suggested_orders (status);

CREATE INDEX IF NOT EXISTS idx_suggested_orders_deleted_at
  ON suggested_orders (deleted_at);

-- ============================================================================
-- Suggested Order Items
-- ============================================================================

CREATE TABLE IF NOT EXISTS suggested_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_order_id UUID NOT NULL REFERENCES suggested_orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  inventory_level_id UUID NOT NULL REFERENCES inventory_levels(id) ON DELETE NO ACTION,
  current_quantity_snapshot DECIMAL(12, 2) NOT NULL,
  par_level_snapshot DECIMAL(12, 2) NOT NULL,
  reorder_point_snapshot DECIMAL(12, 2) NOT NULL,
  needed_quantity DECIMAL(12, 2) NOT NULL,
  suggested_quantity DECIMAL(12, 2) NOT NULL,
  approved_quantity DECIMAL(12, 2),
  unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  prior_average_unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estimated_line_savings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  include_in_order BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(50) NOT NULL DEFAULT 'suggested',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT suggested_order_items_product_fk
    FOREIGN KEY (product_id, organization_id)
    REFERENCES products(id, organization_id)
    ON DELETE NO ACTION,
  CONSTRAINT suggested_order_items_status_valid CHECK (
    status IN ('suggested', 'approved', 'excluded', 'converted')
  ),
  CONSTRAINT suggested_order_items_quantities_valid CHECK (
    current_quantity_snapshot >= 0
    AND par_level_snapshot > 0
    AND reorder_point_snapshot >= 0
    AND needed_quantity > 0
    AND suggested_quantity > 0
    AND (approved_quantity IS NULL OR approved_quantity >= 0)
  ),
  CONSTRAINT suggested_order_items_costs_nonnegative CHECK (
    unit_cost >= 0
    AND prior_average_unit_cost >= 0
    AND estimated_line_savings >= 0
    AND line_total >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_suggested_order_items_order_id
  ON suggested_order_items (suggested_order_id);

CREATE INDEX IF NOT EXISTS idx_suggested_order_items_product_id
  ON suggested_order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_suggested_order_items_inventory_level_id
  ON suggested_order_items (inventory_level_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suggested_order_items_active_order_product
  ON suggested_order_items (suggested_order_id, product_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_suggested_order_items_deleted_at
  ON suggested_order_items (deleted_at);

-- ============================================================================
-- Purchase Order Extensions
-- ============================================================================

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS vendor_id UUID,
  ADD COLUMN IF NOT EXISTS suggested_order_id UUID REFERENCES suggested_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_savings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmation_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mock_supplier_submission BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_vendor_fk;

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_vendor_fk
  FOREIGN KEY (vendor_id, organization_id)
  REFERENCES vendors(id, organization_id)
  ON DELETE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_suggested_order_id
  ON purchase_orders (suggested_order_id)
  WHERE suggested_order_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization_id
  ON purchase_orders (organization_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id
  ON purchase_orders (vendor_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_deleted_at
  ON purchase_orders (deleted_at);

ALTER TABLE purchase_order_items
  ALTER COLUMN inventory_item_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS suggested_order_item_id UUID REFERENCES suggested_order_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE purchase_order_items
  DROP CONSTRAINT IF EXISTS purchase_order_items_product_fk;

ALTER TABLE purchase_order_items
  ADD CONSTRAINT purchase_order_items_product_fk
  FOREIGN KEY (product_id, organization_id)
  REFERENCES products(id, organization_id)
  ON DELETE NO ACTION;

ALTER TABLE purchase_order_items
  DROP CONSTRAINT IF EXISTS purchase_order_items_status_valid;

ALTER TABLE purchase_order_items
  ADD CONSTRAINT purchase_order_items_status_valid CHECK (
    status IN ('open', 'partially_received', 'received', 'cancelled')
  );

CREATE INDEX IF NOT EXISTS idx_po_items_product_id
  ON purchase_order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_po_items_suggested_order_item_id
  ON purchase_order_items (suggested_order_item_id);

CREATE INDEX IF NOT EXISTS idx_po_items_status
  ON purchase_order_items (status);

CREATE INDEX IF NOT EXISTS idx_po_items_deleted_at
  ON purchase_order_items (deleted_at);

-- ============================================================================
-- Receiving Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS receiving_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE NO ACTION,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE NO ACTION,
  purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE NO ACTION,
  product_id UUID NOT NULL,
  received_quantity DECIMAL(12, 2) NOT NULL,
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT receiving_events_product_fk
    FOREIGN KEY (product_id, organization_id)
    REFERENCES products(id, organization_id)
    ON DELETE NO ACTION,
  CONSTRAINT receiving_events_quantity_positive CHECK (received_quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_receiving_events_organization_id
  ON receiving_events (organization_id);

CREATE INDEX IF NOT EXISTS idx_receiving_events_purchase_order_id
  ON receiving_events (purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_receiving_events_purchase_order_item_id
  ON receiving_events (purchase_order_item_id);

CREATE INDEX IF NOT EXISTS idx_receiving_events_product_location
  ON receiving_events (product_id, location_id, received_at DESC);

-- ============================================================================
-- Workflow Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION lighthouse_order_quantity(
  needed_quantity DECIMAL,
  minimum_order_quantity DECIMAL DEFAULT 1,
  order_multiple DECIMAL DEFAULT 1
)
RETURNS DECIMAL
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(
    COALESCE(minimum_order_quantity, 1),
    CEIL(needed_quantity / GREATEST(COALESCE(order_multiple, 1), 1))
      * GREATEST(COALESCE(order_multiple, 1), 1)
  );
$$;

CREATE OR REPLACE FUNCTION lighthouse_sync_suggested_order_totals(target_suggested_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE suggested_orders so
  SET
    suggested_subtotal = COALESCE(t.subtotal, 0),
    estimated_savings = COALESCE(t.estimated_savings, 0)
  FROM (
    SELECT
      suggested_order_id,
      SUM(CASE WHEN include_in_order THEN line_total ELSE 0 END) AS subtotal,
      SUM(CASE WHEN include_in_order THEN estimated_line_savings ELSE 0 END) AS estimated_savings
    FROM suggested_order_items
    WHERE suggested_order_id = target_suggested_order_id
      AND deleted_at IS NULL
    GROUP BY suggested_order_id
  ) t
  WHERE so.id = target_suggested_order_id
    AND so.id = t.suggested_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION lighthouse_generate_suggested_orders(
  target_location_id UUID DEFAULT NULL,
  actor_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  suggested_order_id UUID,
  vendor_id UUID,
  location_id UUID,
  item_count INT,
  suggested_subtotal DECIMAL,
  estimated_savings DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  vendor_location RECORD;
  new_suggested_order_id UUID;
BEGIN
  FOR vendor_location IN
    SELECT DISTINCT
      il.organization_id,
      il.facility_id,
      il.location_id,
      v.id AS vendor_id
    FROM inventory_levels il
    JOIN products p
      ON p.id = il.product_id
     AND p.organization_id = il.organization_id
    JOIN vendors v
      ON v.organization_id = p.organization_id
     AND v.vendor_code = COALESCE(p.metadata ->> 'primary_vendor_code', p.metadata ->> 'vendor_code')
    WHERE il.status = 'low_stock'
      AND il.current_quantity < il.par_level
      AND il.deleted_at IS NULL
      AND p.status = 'active'
      AND p.is_active = TRUE
      AND v.is_active = TRUE
      AND (target_location_id IS NULL OR il.location_id = target_location_id)
  LOOP
    INSERT INTO suggested_orders (
      organization_id,
      facility_id,
      location_id,
      vendor_id,
      status,
      created_by,
      source_note
    )
    VALUES (
      vendor_location.organization_id,
      vendor_location.facility_id,
      vendor_location.location_id,
      vendor_location.vendor_id,
      'review',
      actor_id,
      'Generated from Project Lighthouse low-stock inventory levels.'
    )
    ON CONFLICT (organization_id, vendor_id, location_id)
      WHERE status IN ('review', 'approved') AND deleted_at IS NULL
    DO UPDATE
    SET
      status = 'review',
      created_by = EXCLUDED.created_by,
      reviewed_by = NULL,
      reviewed_at = NULL,
      approved_by = NULL,
      approved_at = NULL,
      deleted_at = NULL,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO new_suggested_order_id;

    DELETE FROM suggested_order_items
    WHERE suggested_order_id = new_suggested_order_id;

    INSERT INTO suggested_order_items (
      suggested_order_id,
      organization_id,
      product_id,
      inventory_level_id,
      current_quantity_snapshot,
      par_level_snapshot,
      reorder_point_snapshot,
      needed_quantity,
      suggested_quantity,
      approved_quantity,
      unit_cost,
      prior_average_unit_cost,
      estimated_line_savings,
      line_total,
      include_in_order,
      status
    )
    SELECT
      new_suggested_order_id,
      il.organization_id,
      p.id,
      il.id,
      il.current_quantity,
      il.par_level,
      il.reorder_point,
      il.par_level - il.current_quantity AS needed_quantity,
      lighthouse_order_quantity(
        il.par_level - il.current_quantity,
        COALESCE((p.metadata ->> 'minimum_order_quantity')::DECIMAL, 1),
        COALESCE((p.metadata ->> 'order_multiple')::DECIMAL, 1)
      ) AS suggested_quantity,
      lighthouse_order_quantity(
        il.par_level - il.current_quantity,
        COALESCE((p.metadata ->> 'minimum_order_quantity')::DECIMAL, 1),
        COALESCE((p.metadata ->> 'order_multiple')::DECIMAL, 1)
      ) AS approved_quantity,
      COALESCE((p.metadata ->> 'unit_cost')::DECIMAL, 0) AS unit_cost,
      COALESCE((p.metadata ->> 'prior_average_unit_cost')::DECIMAL, 0) AS prior_average_unit_cost,
      GREATEST(
        0,
        (
          COALESCE((p.metadata ->> 'prior_average_unit_cost')::DECIMAL, 0)
          - COALESCE((p.metadata ->> 'unit_cost')::DECIMAL, 0)
        ) * lighthouse_order_quantity(
          il.par_level - il.current_quantity,
          COALESCE((p.metadata ->> 'minimum_order_quantity')::DECIMAL, 1),
          COALESCE((p.metadata ->> 'order_multiple')::DECIMAL, 1)
        )
      ) AS estimated_line_savings,
      COALESCE((p.metadata ->> 'unit_cost')::DECIMAL, 0)
        * lighthouse_order_quantity(
          il.par_level - il.current_quantity,
          COALESCE((p.metadata ->> 'minimum_order_quantity')::DECIMAL, 1),
          COALESCE((p.metadata ->> 'order_multiple')::DECIMAL, 1)
        ) AS line_total,
      TRUE,
      'suggested'
    FROM inventory_levels il
    JOIN products p
      ON p.id = il.product_id
     AND p.organization_id = il.organization_id
    WHERE il.status = 'low_stock'
      AND il.current_quantity < il.par_level
      AND il.deleted_at IS NULL
      AND p.status = 'active'
      AND p.is_active = TRUE
      AND il.organization_id = vendor_location.organization_id
      AND il.facility_id = vendor_location.facility_id
      AND il.location_id = vendor_location.location_id
      AND COALESCE(p.metadata ->> 'primary_vendor_code', p.metadata ->> 'vendor_code') = (
        SELECT vendor_code FROM vendors WHERE id = vendor_location.vendor_id
      );

    PERFORM lighthouse_sync_suggested_order_totals(new_suggested_order_id);
  END LOOP;

  RETURN QUERY
  SELECT
    so.id,
    so.vendor_id,
    so.location_id,
    COUNT(soi.id)::INT,
    so.suggested_subtotal,
    so.estimated_savings
  FROM suggested_orders so
  LEFT JOIN suggested_order_items soi
    ON soi.suggested_order_id = so.id
   AND soi.deleted_at IS NULL
  WHERE so.status = 'review'
    AND so.deleted_at IS NULL
    AND (target_location_id IS NULL OR so.location_id = target_location_id)
  GROUP BY so.id, so.vendor_id, so.location_id, so.suggested_subtotal, so.estimated_savings
  ORDER BY so.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION lighthouse_approve_suggested_order(
  target_suggested_order_id UUID,
  actor_id UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  source_order suggested_orders%ROWTYPE;
  new_purchase_order_id UUID;
BEGIN
  SELECT *
  INTO source_order
  FROM suggested_orders
  WHERE id = target_suggested_order_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggested order % not found', target_suggested_order_id;
  END IF;

  IF source_order.status NOT IN ('review', 'approved') THEN
    RAISE EXCEPTION 'Suggested order % cannot be approved from status %', target_suggested_order_id, source_order.status;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM suggested_order_items
    WHERE suggested_order_id = target_suggested_order_id
      AND deleted_at IS NULL
      AND include_in_order = TRUE
      AND COALESCE(approved_quantity, suggested_quantity) > 0
  ) THEN
    RAISE EXCEPTION 'Suggested order % has no approvable items', target_suggested_order_id;
  END IF;

  UPDATE suggested_order_items
  SET
    approved_quantity = COALESCE(approved_quantity, suggested_quantity),
    status = CASE WHEN include_in_order THEN 'approved' ELSE 'excluded' END,
    line_total = CASE
      WHEN include_in_order THEN COALESCE(approved_quantity, suggested_quantity) * unit_cost
      ELSE 0
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE suggested_order_id = target_suggested_order_id
    AND deleted_at IS NULL;

  PERFORM lighthouse_sync_suggested_order_totals(target_suggested_order_id);

  UPDATE suggested_orders
  SET
    status = 'approved',
    reviewed_by = COALESCE(reviewed_by, actor_id),
    reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP),
    approved_by = actor_id,
    approved_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_suggested_order_id
    AND deleted_at IS NULL;

  SELECT *
  INTO source_order
  FROM suggested_orders
  WHERE id = target_suggested_order_id
    AND deleted_at IS NULL;

  INSERT INTO purchase_orders (
    organization_id,
    facility_id,
    vendor_id,
    suggested_order_id,
    po_number,
    po_date,
    expected_delivery_date,
    status,
    total_amount,
    estimated_savings,
    currency,
    confirmation_number,
    mock_supplier_submission,
    created_by
  )
  VALUES (
    source_order.organization_id,
    source_order.facility_id,
    source_order.vendor_id,
    source_order.id,
    'PO-LH-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6)),
    CURRENT_TIMESTAMP,
    CURRENT_DATE + INTERVAL '2 days',
    'submitted',
    source_order.suggested_subtotal,
    source_order.estimated_savings,
    'USD',
    'MOCK-PATTERSON-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8)),
    TRUE,
    actor_id
  )
  ON CONFLICT (suggested_order_id) WHERE suggested_order_id IS NOT NULL AND deleted_at IS NULL
  DO UPDATE
  SET
    total_amount = EXCLUDED.total_amount,
    estimated_savings = EXCLUDED.estimated_savings,
    status = EXCLUDED.status,
    confirmation_number = EXCLUDED.confirmation_number,
    mock_supplier_submission = EXCLUDED.mock_supplier_submission,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO new_purchase_order_id;

  DELETE FROM purchase_order_items
  WHERE purchase_order_id = new_purchase_order_id;

  INSERT INTO purchase_order_items (
    purchase_order_id,
    organization_id,
    product_id,
    suggested_order_item_id,
    quantity_ordered,
    quantity_received,
    unit_price,
    line_total,
    uom,
    status
  )
  SELECT
    new_purchase_order_id,
    soi.organization_id,
    soi.product_id,
    soi.id,
    COALESCE(soi.approved_quantity, soi.suggested_quantity),
    0,
    soi.unit_cost,
    COALESCE(soi.approved_quantity, soi.suggested_quantity) * soi.unit_cost,
    u.code,
    'open'
  FROM suggested_order_items soi
  JOIN products p
    ON p.id = soi.product_id
   AND p.organization_id = soi.organization_id
  JOIN units_of_measure u
    ON u.id = p.unit_of_measure_id
   AND u.organization_id = p.organization_id
  WHERE soi.suggested_order_id = target_suggested_order_id
    AND soi.deleted_at IS NULL
    AND soi.include_in_order = TRUE
    AND COALESCE(soi.approved_quantity, soi.suggested_quantity) > 0;

  UPDATE suggested_order_items
  SET status = 'converted',
      updated_at = CURRENT_TIMESTAMP
  WHERE suggested_order_id = target_suggested_order_id
    AND deleted_at IS NULL
    AND include_in_order = TRUE;

  UPDATE suggested_orders
  SET status = 'converted',
      updated_at = CURRENT_TIMESTAMP
  WHERE id = target_suggested_order_id
    AND deleted_at IS NULL;

  RETURN new_purchase_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION lighthouse_apply_receiving_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_item purchase_order_items%ROWTYPE;
  order_header purchase_orders%ROWTYPE;
BEGIN
  SELECT *
  INTO order_item
  FROM purchase_order_items
  WHERE id = NEW.purchase_order_item_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order item % not found', NEW.purchase_order_item_id;
  END IF;

  SELECT *
  INTO order_header
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order % not found', NEW.purchase_order_id;
  END IF;

  IF order_item.purchase_order_id <> NEW.purchase_order_id THEN
    RAISE EXCEPTION 'Receiving event purchase order does not match purchase order item';
  END IF;

  IF order_item.product_id <> NEW.product_id THEN
    RAISE EXCEPTION 'Receiving event product does not match purchase order item';
  END IF;

  IF order_header.facility_id <> NEW.facility_id THEN
    RAISE EXCEPTION 'Receiving event facility does not match purchase order';
  END IF;

  IF COALESCE(order_item.quantity_received, 0) + NEW.received_quantity > order_item.quantity_ordered THEN
    RAISE EXCEPTION 'Receiving event quantity exceeds ordered quantity';
  END IF;

  UPDATE inventory_levels
  SET
    current_quantity = current_quantity + NEW.received_quantity,
    updated_at = CURRENT_TIMESTAMP
  WHERE organization_id = NEW.organization_id
    AND facility_id = NEW.facility_id
    AND location_id = NEW.location_id
    AND product_id = NEW.product_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory level not found for received product/location';
  END IF;

  UPDATE purchase_order_items
  SET
    quantity_received = COALESCE(quantity_received, 0) + NEW.received_quantity,
    status = CASE
      WHEN COALESCE(quantity_received, 0) + NEW.received_quantity >= quantity_ordered THEN 'received'
      ELSE 'partially_received'
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.purchase_order_item_id;

  UPDATE purchase_orders po
  SET
    status = CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM purchase_order_items poi
        WHERE poi.purchase_order_id = po.id
          AND poi.deleted_at IS NULL
          AND poi.status NOT IN ('received', 'cancelled')
      ) THEN 'received'
      ELSE 'confirmed'
    END,
    actual_delivery_date = CURRENT_DATE,
    updated_at = CURRENT_TIMESTAMP
  WHERE po.id = NEW.purchase_order_id
    AND po.status <> 'cancelled';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_lighthouse_receiving_event ON receiving_events;

CREATE TRIGGER apply_lighthouse_receiving_event
  AFTER INSERT ON receiving_events
  FOR EACH ROW
  EXECUTE FUNCTION lighthouse_apply_receiving_event();

CREATE OR REPLACE VIEW lighthouse_low_stock_products AS
SELECT
  il.id AS inventory_level_id,
  il.organization_id,
  il.facility_id,
  il.location_id,
  l.name AS location_name,
  p.id AS product_id,
  p.sku,
  p.name AS product_name,
  p.metadata ->> 'vendor_sku' AS vendor_sku,
  v.id AS vendor_id,
  v.name AS vendor_name,
  il.current_quantity,
  il.reorder_point,
  il.par_level,
  il.status,
  GREATEST(il.par_level - il.current_quantity, 0) AS needed_quantity,
  COALESCE((p.metadata ->> 'unit_cost')::DECIMAL, 0) AS unit_cost
FROM inventory_levels il
JOIN locations l
  ON l.id = il.location_id
JOIN products p
  ON p.id = il.product_id
 AND p.organization_id = il.organization_id
LEFT JOIN vendors v
  ON v.organization_id = p.organization_id
 AND v.vendor_code = COALESCE(p.metadata ->> 'primary_vendor_code', p.metadata ->> 'vendor_code')
WHERE il.status = 'low_stock'
  AND il.current_quantity < il.par_level
  AND il.deleted_at IS NULL
  AND p.status = 'active'
  AND p.is_active = TRUE;

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receiving_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_levels_own_org ON inventory_levels;
DROP POLICY IF EXISTS suggested_orders_own_org ON suggested_orders;
DROP POLICY IF EXISTS suggested_order_items_own_org ON suggested_order_items;
DROP POLICY IF EXISTS purchase_orders_own_org ON purchase_orders;
DROP POLICY IF EXISTS purchase_order_items_own_org ON purchase_order_items;
DROP POLICY IF EXISTS receiving_events_own_org ON receiving_events;

CREATE POLICY inventory_levels_own_org
  ON inventory_levels
  FOR ALL
  USING (
    organization_id = public.current_user_organization_id()
    AND deleted_at IS NULL
  )
  WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY suggested_orders_own_org
  ON suggested_orders
  FOR ALL
  USING (
    organization_id = public.current_user_organization_id()
    AND deleted_at IS NULL
  )
  WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY suggested_order_items_own_org
  ON suggested_order_items
  FOR ALL
  USING (
    organization_id = public.current_user_organization_id()
    AND deleted_at IS NULL
  )
  WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY purchase_orders_own_org
  ON purchase_orders
  FOR ALL
  USING (
    COALESCE(
      organization_id,
      (SELECT f.organization_id FROM facilities f WHERE f.id = purchase_orders.facility_id)
    ) = public.current_user_organization_id()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    COALESCE(
      organization_id,
      (SELECT f.organization_id FROM facilities f WHERE f.id = purchase_orders.facility_id)
    ) = public.current_user_organization_id()
  );

CREATE POLICY purchase_order_items_own_org
  ON purchase_order_items
  FOR ALL
  USING (
    deleted_at IS NULL
    AND purchase_order_id IN (
      SELECT po.id
      FROM purchase_orders po
      WHERE COALESCE(
        po.organization_id,
        (SELECT f.organization_id FROM facilities f WHERE f.id = po.facility_id)
      ) = public.current_user_organization_id()
        AND po.deleted_at IS NULL
    )
  )
  WITH CHECK (
    COALESCE(
      organization_id,
      (
        SELECT COALESCE(
          po.organization_id,
          (SELECT f.organization_id FROM facilities f WHERE f.id = po.facility_id)
        )
        FROM purchase_orders po
        WHERE po.id = purchase_order_items.purchase_order_id
      )
    ) = public.current_user_organization_id()
  );

CREATE POLICY receiving_events_own_org
  ON receiving_events
  FOR ALL
  USING (organization_id = public.current_user_organization_id())
  WITH CHECK (organization_id = public.current_user_organization_id());

-- ============================================================================
-- Updated-at Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_inventory_levels_updated_at ON inventory_levels;
DROP TRIGGER IF EXISTS update_suggested_orders_updated_at ON suggested_orders;
DROP TRIGGER IF EXISTS update_suggested_order_items_updated_at ON suggested_order_items;
DROP TRIGGER IF EXISTS update_purchase_order_items_updated_at ON purchase_order_items;
DROP TRIGGER IF EXISTS update_receiving_events_updated_at ON receiving_events;

CREATE TRIGGER update_inventory_levels_updated_at
  BEFORE UPDATE ON inventory_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggested_orders_updated_at
  BEFORE UPDATE ON suggested_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggested_order_items_updated_at
  BEFORE UPDATE ON suggested_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_order_items_updated_at
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receiving_events_updated_at
  BEFORE UPDATE ON receiving_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE inventory_levels IS 'Project Lighthouse product catalog inventory by location with par and reorder thresholds.';
COMMENT ON TABLE suggested_orders IS 'Suggested order headers grouped by vendor and location for the Dentira demo workflow.';
COMMENT ON TABLE suggested_order_items IS 'Suggested order line items generated from low-stock inventory levels.';
COMMENT ON TABLE receiving_events IS 'Receipt records that automatically update Project Lighthouse inventory levels.';
COMMENT ON VIEW lighthouse_low_stock_products IS 'Read model for low-stock product catalog items in the Project Lighthouse workflow.';

COMMIT;
