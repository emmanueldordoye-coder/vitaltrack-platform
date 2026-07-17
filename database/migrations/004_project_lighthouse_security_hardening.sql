-- Migration: 004_project_lighthouse_security_hardening
-- Description: Security hardening for Project Lighthouse workflow RPCs and low-stock read model.

BEGIN;

CREATE OR REPLACE FUNCTION lighthouse_order_quantity(
  needed_quantity DECIMAL,
  minimum_order_quantity DECIMAL DEFAULT 1,
  order_multiple DECIMAL DEFAULT 1
)
RETURNS DECIMAL
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public
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
SET search_path = pg_catalog, public
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
  out_vendor_id UUID,
  out_location_id UUID,
  item_count INT,
  suggested_subtotal DECIMAL,
  estimated_savings DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  vendor_location RECORD;
  new_suggested_order_id UUID;
  caller_id UUID := auth.uid();
  caller_org_id UUID;
  caller_app_role VARCHAR(50);
  target_org_id UUID;
BEGIN
  -- actor_id remains for RPC compatibility; auth.uid() is authoritative.
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to generate suggested orders' USING ERRCODE = '42501';
  END IF;

  SELECT u.organization_id, u.role
  INTO caller_org_id, caller_app_role
  FROM public.users u
  WHERE u.id = caller_id
    AND u.is_active = TRUE;

  IF caller_org_id IS NULL OR caller_app_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'User cannot generate suggested orders' USING ERRCODE = '42501';
  END IF;

  IF target_location_id IS NOT NULL THEN
    SELECT f.organization_id
    INTO target_org_id
    FROM public.locations l
    JOIN public.facilities f ON f.id = l.facility_id
    WHERE l.id = target_location_id
      AND l.is_active = TRUE;

    IF target_org_id IS NULL OR target_org_id <> caller_org_id THEN
      RAISE EXCEPTION 'Location is not available to caller' USING ERRCODE = '42501';
    END IF;
  END IF;

  FOR vendor_location IN
    SELECT DISTINCT il.organization_id, il.facility_id, il.location_id, v.id AS vendor_id
    FROM inventory_levels il
    JOIN products p
      ON p.id = il.product_id
     AND p.organization_id = il.organization_id
    JOIN vendors v
      ON v.organization_id = p.organization_id
     AND v.vendor_code = COALESCE(p.metadata ->> 'primary_vendor_code', p.metadata ->> 'vendor_code')
    WHERE il.status = 'low_stock'
      AND il.current_quantity < il.par_level
      AND il.organization_id = caller_org_id
      AND il.deleted_at IS NULL
      AND p.status = 'active'
      AND p.is_active = TRUE
      AND v.is_active = TRUE
      AND (target_location_id IS NULL OR il.location_id = target_location_id)
  LOOP
    INSERT INTO suggested_orders (
      organization_id, facility_id, location_id, vendor_id, status, created_by, source_note
    )
    VALUES (
      vendor_location.organization_id,
      vendor_location.facility_id,
      vendor_location.location_id,
      vendor_location.vendor_id,
      'review',
      caller_id,
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
      il.par_level - il.current_quantity,
      lighthouse_order_quantity(il.par_level - il.current_quantity, COALESCE((p.metadata ->> 'minimum_order_quantity')::DECIMAL, 1), COALESCE((p.metadata ->> 'order_multiple')::DECIMAL, 1)),
      lighthouse_order_quantity(il.par_level - il.current_quantity, COALESCE((p.metadata ->> 'minimum_order_quantity')::DECIMAL, 1), COALESCE((p.metadata ->> 'order_multiple')::DECIMAL, 1)),
      COALESCE((p.metadata ->> 'unit_cost')::DECIMAL, 0),
      COALESCE((p.metadata ->> 'prior_average_unit_cost')::DECIMAL, 0),
      GREATEST(0, (COALESCE((p.metadata ->> 'prior_average_unit_cost')::DECIMAL, 0) - COALESCE((p.metadata ->> 'unit_cost')::DECIMAL, 0))
        * lighthouse_order_quantity(il.par_level - il.current_quantity, COALESCE((p.metadata ->> 'minimum_order_quantity')::DECIMAL, 1), COALESCE((p.metadata ->> 'order_multiple')::DECIMAL, 1))),
      COALESCE((p.metadata ->> 'unit_cost')::DECIMAL, 0)
        * lighthouse_order_quantity(il.par_level - il.current_quantity, COALESCE((p.metadata ->> 'minimum_order_quantity')::DECIMAL, 1), COALESCE((p.metadata ->> 'order_multiple')::DECIMAL, 1)),
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
        SELECT vendor_code
        FROM vendors
        WHERE id = vendor_location.vendor_id
          AND organization_id = caller_org_id
      );

    PERFORM lighthouse_sync_suggested_order_totals(new_suggested_order_id);
  END LOOP;

  RETURN QUERY
  SELECT so.id, so.vendor_id AS out_vendor_id, so.location_id AS out_location_id, COUNT(soi.id)::INT, so.suggested_subtotal, so.estimated_savings
  FROM suggested_orders so
  LEFT JOIN suggested_order_items soi
    ON soi.suggested_order_id = so.id
   AND soi.deleted_at IS NULL
  WHERE so.status = 'review'
    AND so.organization_id = caller_org_id
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
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  source_order suggested_orders%ROWTYPE;
  new_purchase_order_id UUID;
  caller_id UUID := auth.uid();
  caller_org_id UUID;
  caller_app_role VARCHAR(50);
BEGIN
  -- actor_id remains for RPC compatibility; auth.uid() is authoritative.
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to approve suggested orders' USING ERRCODE = '42501';
  END IF;

  SELECT u.organization_id, u.role
  INTO caller_org_id, caller_app_role
  FROM public.users u
  WHERE u.id = caller_id
    AND u.is_active = TRUE;

  IF caller_org_id IS NULL OR caller_app_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'User cannot approve suggested orders' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO source_order
  FROM suggested_orders
  WHERE id = target_suggested_order_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggested order % not found', target_suggested_order_id;
  END IF;

  IF source_order.organization_id <> caller_org_id THEN
    RAISE EXCEPTION 'Suggested order is not available to caller' USING ERRCODE = '42501';
  END IF;

  IF source_order.status NOT IN ('review', 'approved') THEN
    RAISE EXCEPTION 'Suggested order % cannot be approved from status %', target_suggested_order_id, source_order.status;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM suggested_order_items
    WHERE suggested_order_id = target_suggested_order_id
      AND organization_id = caller_org_id
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
    line_total = CASE WHEN include_in_order THEN COALESCE(approved_quantity, suggested_quantity) * unit_cost ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP
  WHERE suggested_order_id = target_suggested_order_id
    AND organization_id = caller_org_id
    AND deleted_at IS NULL;

  PERFORM lighthouse_sync_suggested_order_totals(target_suggested_order_id);

  UPDATE suggested_orders
  SET
    status = 'approved',
    reviewed_by = COALESCE(reviewed_by, caller_id),
    reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP),
    approved_by = caller_id,
    approved_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_suggested_order_id
    AND organization_id = caller_org_id
    AND deleted_at IS NULL;

  SELECT *
  INTO source_order
  FROM suggested_orders
  WHERE id = target_suggested_order_id
    AND organization_id = caller_org_id
    AND deleted_at IS NULL;

  INSERT INTO purchase_orders (
    organization_id, facility_id, vendor_id, suggested_order_id, po_number, po_date,
    expected_delivery_date, status, total_amount, estimated_savings, currency,
    confirmation_number, mock_supplier_submission, created_by
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
    caller_id
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
    purchase_order_id, organization_id, product_id, suggested_order_item_id,
    quantity_ordered, quantity_received, unit_price, line_total, uom, status
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
    AND soi.organization_id = caller_org_id
    AND soi.deleted_at IS NULL
    AND soi.include_in_order = TRUE
    AND COALESCE(soi.approved_quantity, soi.suggested_quantity) > 0;

  UPDATE suggested_order_items
  SET status = 'converted',
      updated_at = CURRENT_TIMESTAMP
  WHERE suggested_order_id = target_suggested_order_id
    AND organization_id = caller_org_id
    AND deleted_at IS NULL
    AND include_in_order = TRUE;

  UPDATE suggested_orders
  SET status = 'converted',
      updated_at = CURRENT_TIMESTAMP
  WHERE id = target_suggested_order_id
    AND organization_id = caller_org_id
    AND deleted_at IS NULL;

  RETURN new_purchase_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION lighthouse_apply_receiving_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  order_item purchase_order_items%ROWTYPE;
  order_header purchase_orders%ROWTYPE;
  caller_id UUID := auth.uid();
  caller_org_id UUID;
  caller_app_role VARCHAR(50);
  location_org_id UUID;
  received_by_org_id UUID;
BEGIN
  IF caller_id IS NULL THEN
    IF COALESCE(auth.role(), '') <> 'service_role' THEN
      RAISE EXCEPTION 'Authentication required to receive purchase order items' USING ERRCODE = '42501';
    END IF;
  ELSE
    SELECT u.organization_id, u.role
    INTO caller_org_id, caller_app_role
    FROM public.users u
    WHERE u.id = caller_id
      AND u.is_active = TRUE;

    IF caller_org_id IS NULL OR caller_app_role NOT IN ('admin', 'manager') THEN
      RAISE EXCEPTION 'User cannot receive purchase order items' USING ERRCODE = '42501';
    END IF;

    IF NEW.organization_id <> caller_org_id THEN
      RAISE EXCEPTION 'Receiving event organization does not match caller' USING ERRCODE = '42501';
    END IF;

    IF NEW.received_by IS NOT NULL AND NEW.received_by <> caller_id THEN
      RAISE EXCEPTION 'Receiving event received_by must match authenticated caller' USING ERRCODE = '42501';
    END IF;

    NEW.received_by := caller_id;
  END IF;

  SELECT f.organization_id
  INTO location_org_id
  FROM public.locations l
  JOIN public.facilities f ON f.id = l.facility_id
  WHERE l.id = NEW.location_id
    AND f.id = NEW.facility_id
    AND l.is_active = TRUE;

  IF location_org_id IS NULL OR location_org_id <> NEW.organization_id THEN
    RAISE EXCEPTION 'Receiving event location/facility does not match organization' USING ERRCODE = '42501';
  END IF;

  IF caller_id IS NULL AND NEW.received_by IS NOT NULL THEN
    SELECT u.organization_id
    INTO received_by_org_id
    FROM public.users u
    WHERE u.id = NEW.received_by
      AND u.is_active = TRUE;

    IF received_by_org_id IS NULL OR received_by_org_id <> NEW.organization_id THEN
      RAISE EXCEPTION 'Receiving event received_by user does not match organization' USING ERRCODE = '42501';
    END IF;
  END IF;

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

  IF order_item.purchase_order_id <> NEW.purchase_order_id
     OR order_item.organization_id IS DISTINCT FROM NEW.organization_id
     OR order_item.product_id IS DISTINCT FROM NEW.product_id
     OR order_header.organization_id IS DISTINCT FROM NEW.organization_id
     OR order_header.facility_id <> NEW.facility_id THEN
    RAISE EXCEPTION 'Receiving event does not match purchase order context' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(order_item.quantity_received, 0) + NEW.received_quantity > order_item.quantity_ordered THEN
    RAISE EXCEPTION 'Receiving event quantity exceeds ordered quantity';
  END IF;

  UPDATE inventory_levels
  SET current_quantity = current_quantity + NEW.received_quantity,
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
  BEFORE INSERT ON receiving_events
  FOR EACH ROW
  EXECUTE FUNCTION lighthouse_apply_receiving_event();

CREATE OR REPLACE VIEW lighthouse_low_stock_products
WITH (security_invoker = true) AS
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

DROP POLICY IF EXISTS receiving_events_own_org ON receiving_events;
DROP POLICY IF EXISTS receiving_events_select_own_org ON receiving_events;
DROP POLICY IF EXISTS receiving_events_insert_own_org ON receiving_events;
DROP POLICY IF EXISTS receiving_events_update_block ON receiving_events;
DROP POLICY IF EXISTS receiving_events_delete_block ON receiving_events;

CREATE POLICY receiving_events_select_own_org
  ON receiving_events
  FOR SELECT
  USING (organization_id = public.current_user_organization_id());

CREATE POLICY receiving_events_insert_own_org
  ON receiving_events
  FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_organization_id()
    AND public.current_user_role() IN ('admin', 'manager')
  );

CREATE POLICY receiving_events_update_block
  ON receiving_events
  FOR UPDATE
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY receiving_events_delete_block
  ON receiving_events
  FOR DELETE
  USING (FALSE);

REVOKE UPDATE, DELETE ON receiving_events FROM PUBLIC;
REVOKE UPDATE, DELETE ON receiving_events FROM anon, authenticated, service_role;
GRANT SELECT ON receiving_events TO authenticated;
GRANT INSERT ON receiving_events TO authenticated;
GRANT INSERT ON receiving_events TO service_role;

COMMENT ON POLICY receiving_events_select_own_org ON receiving_events IS
  'Same-tenant read access for append-only Project Lighthouse receiving events.';
COMMENT ON POLICY receiving_events_insert_own_org ON receiving_events IS
  'Same-tenant manager/admin insert access only; receiving events cannot be updated or deleted by authenticated users.';

REVOKE ALL ON FUNCTION lighthouse_order_quantity(DECIMAL, DECIMAL, DECIMAL) FROM PUBLIC;
REVOKE ALL ON FUNCTION lighthouse_sync_suggested_order_totals(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION lighthouse_generate_suggested_orders(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION lighthouse_approve_suggested_order(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION lighthouse_apply_receiving_event() FROM PUBLIC;
REVOKE ALL ON lighthouse_low_stock_products FROM PUBLIC;

REVOKE ALL ON FUNCTION lighthouse_order_quantity(DECIMAL, DECIMAL, DECIMAL) FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION lighthouse_sync_suggested_order_totals(UUID) FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION lighthouse_generate_suggested_orders(UUID, UUID) FROM anon, service_role;
REVOKE ALL ON FUNCTION lighthouse_approve_suggested_order(UUID, UUID) FROM anon, service_role;
REVOKE ALL ON FUNCTION lighthouse_apply_receiving_event() FROM anon, authenticated, service_role;
REVOKE ALL ON lighthouse_low_stock_products FROM anon, service_role;

GRANT EXECUTE ON FUNCTION lighthouse_generate_suggested_orders(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION lighthouse_approve_suggested_order(UUID, UUID) TO authenticated;
GRANT SELECT ON lighthouse_low_stock_products TO authenticated;

COMMENT ON FUNCTION lighthouse_generate_suggested_orders(UUID, UUID) IS 'Creates Project Lighthouse suggested orders for the authenticated caller organization only.';
COMMENT ON FUNCTION lighthouse_approve_suggested_order(UUID, UUID) IS 'Approves a same-tenant suggested order and creates a mock purchase order.';
COMMENT ON FUNCTION lighthouse_apply_receiving_event() IS 'Applies append-only receiving events after validating caller identity, received_by attribution, same-tenant purchase order, item, location, non-null matching product context, and ordered quantity.';
COMMENT ON TABLE receiving_events IS 'Append-only receipt audit records for Project Lighthouse. Authenticated managers insert same-tenant receipts with received_by fixed to auth.uid(); service_role insert is reserved for trusted server-side receiving jobs and still runs tenant consistency checks.';

COMMIT;
