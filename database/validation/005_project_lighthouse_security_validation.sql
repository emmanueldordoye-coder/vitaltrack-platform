-- Project Lighthouse tenant-isolation validation.
-- Run after migrations 001-004 and the Dentira demo seed. The transaction rolls back
-- temporary users and the cross-tenant fixture data.

BEGIN;

SET LOCAL statement_timeout = '30s';

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'lighthouse.manager.a@example.test',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'lighthouse.manager.b@example.test',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    role = EXCLUDED.role,
    aud = EXCLUDED.aud,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO organizations (id, name, slug, description, tier, status)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'Lighthouse Tenant B',
  'lighthouse-tenant-b',
  'Project Lighthouse tenant-isolation fixture',
  'professional',
  'active'
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (id, organization_id, email, full_name, role, is_active)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'lighthouse.manager.a@example.test',
    'Lighthouse Manager A',
    'manager',
    TRUE
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'lighthouse.manager.b@example.test',
    'Lighthouse Manager B',
    'manager',
    TRUE
  )
ON CONFLICT (organization_id, email) DO UPDATE
SET id = EXCLUDED.id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO facilities (id, organization_id, name, facility_type, city, state, country, timezone, is_active)
VALUES (
  'e1000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'Tenant B Dental Office',
  'dental_office',
  'Austin',
  'TX',
  'USA',
  'America/Chicago',
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    facility_type = EXCLUDED.facility_type,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    timezone = EXCLUDED.timezone,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO departments (id, facility_id, name, department_code, description, is_active)
VALUES (
  'e2000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  'Clinical Operations',
  'CLINICAL-B',
  'Tenant B validation department',
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    department_code = EXCLUDED.department_code,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO locations (id, facility_id, department_id, name, location_code, location_type, capacity_units, is_active)
VALUES (
  'e3000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0000-000000000001',
  'Tenant B Stockroom',
  'B-STOCK',
  'room',
  100,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    location_code = EXCLUDED.location_code,
    location_type = EXCLUDED.location_type,
    capacity_units = EXCLUDED.capacity_units,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO vendors (id, organization_id, name, vendor_code, contact_name, email, phone, website, payment_terms, is_active, metadata)
VALUES (
  'e4000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'Patterson Dental',
  'PATTERSON_DENTAL',
  'Tenant B Patterson Desk',
  'orders-b@patterson-demo.example',
  '1-800-555-0100',
  'https://www.pattersondental.com',
  'Net 30',
  TRUE,
  '{"mock_supplier":true}'::jsonb
)
ON CONFLICT (organization_id, vendor_code) DO UPDATE
SET name = EXCLUDED.name,
    contact_name = EXCLUDED.contact_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    payment_terms = EXCLUDED.payment_terms,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO units_of_measure (organization_id, code, name, dimension, allows_decimal, is_base_unit, conversion_factor)
VALUES ('e0000000-0000-0000-0000-000000000001', 'box', 'Box', 'count', FALSE, TRUE, 1)
ON CONFLICT (organization_id, code) DO UPDATE
SET name = EXCLUDED.name,
    dimension = EXCLUDED.dimension,
    allows_decimal = EXCLUDED.allows_decimal,
    is_base_unit = EXCLUDED.is_base_unit,
    conversion_factor = EXCLUDED.conversion_factor,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (organization_id, name, slug, category_code, description, sort_order, is_active)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'Tenant B Supplies',
  'tenant-b-supplies',
  'B-SUP',
  'Tenant B validation supplies',
  1,
  TRUE
)
ON CONFLICT (organization_id, slug) DO UPDATE
SET name = EXCLUDED.name,
    category_code = EXCLUDED.category_code,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

WITH tenant_b_catalog AS (
  SELECT c.organization_id, c.id AS category_id, u.id AS unit_of_measure_id
  FROM categories c
  JOIN units_of_measure u
    ON u.organization_id = c.organization_id
   AND u.code = 'box'
  WHERE c.organization_id = 'e0000000-0000-0000-0000-000000000001'
    AND c.slug = 'tenant-b-supplies'
)
INSERT INTO products (
  id,
  organization_id,
  category_id,
  unit_of_measure_id,
  sku,
  name,
  description,
  manufacturer_part_number,
  product_type,
  status,
  is_active,
  metadata
)
SELECT
  'e4500000-0000-0000-0000-000000000001',
  organization_id,
  category_id,
  unit_of_measure_id,
  'TENANT-B-GLOVES',
  'Tenant B Nitrile Gloves',
  'Tenant B validation product',
  'B-GLV',
  'supply',
  'active',
  TRUE,
  '{"primary_vendor_code":"PATTERSON_DENTAL","vendor_sku":"B-GLV","unit_cost":10.00,"prior_average_unit_cost":12.00,"minimum_order_quantity":1,"order_multiple":1}'::jsonb
FROM tenant_b_catalog
ON CONFLICT (organization_id, sku) DO UPDATE
SET category_id = EXCLUDED.category_id,
    unit_of_measure_id = EXCLUDED.unit_of_measure_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    manufacturer_part_number = EXCLUDED.manufacturer_part_number,
    product_type = EXCLUDED.product_type,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO inventory_levels (
  organization_id,
  facility_id,
  location_id,
  product_id,
  current_quantity,
  par_level,
  reorder_point,
  last_counted_at
)
SELECT
  'e0000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  'e3000000-0000-0000-0000-000000000001',
  p.id,
  1,
  10,
  5,
  CURRENT_TIMESTAMP
FROM products p
WHERE p.organization_id = 'e0000000-0000-0000-0000-000000000001'
  AND p.sku = 'TENANT-B-GLOVES'
ON CONFLICT (organization_id, product_id, location_id) WHERE deleted_at IS NULL DO UPDATE
SET current_quantity = EXCLUDED.current_quantity,
    par_level = EXCLUDED.par_level,
    reorder_point = EXCLUDED.reorder_point,
    deleted_at = NULL,
    last_counted_at = EXCLUDED.last_counted_at,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO suggested_orders (
  id,
  organization_id,
  facility_id,
  location_id,
  vendor_id,
  status,
  suggested_subtotal,
  estimated_savings,
  source_note
)
SELECT
  'e5000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  'e3000000-0000-0000-0000-000000000001',
  v.id,
  'review',
  10,
  2,
  'Tenant B cross-tenant approval fixture.'
FROM vendors v
WHERE v.organization_id = 'e0000000-0000-0000-0000-000000000001'
  AND v.vendor_code = 'PATTERSON_DENTAL'
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    suggested_subtotal = EXCLUDED.suggested_subtotal,
    estimated_savings = EXCLUDED.estimated_savings,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO suggested_order_items (
  id,
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
  'e5100000-0000-0000-0000-000000000001',
  'e5000000-0000-0000-0000-000000000001',
  il.organization_id,
  il.product_id,
  il.id,
  il.current_quantity,
  il.par_level,
  il.reorder_point,
  9,
  9,
  9,
  10,
  12,
  18,
  90,
  TRUE,
  'suggested'
FROM inventory_levels il
JOIN products p
  ON p.id = il.product_id
 AND p.organization_id = il.organization_id
WHERE il.organization_id = 'e0000000-0000-0000-0000-000000000001'
  AND p.sku = 'TENANT-B-GLOVES'
ON CONFLICT (id) DO UPDATE
SET current_quantity_snapshot = EXCLUDED.current_quantity_snapshot,
    par_level_snapshot = EXCLUDED.par_level_snapshot,
    reorder_point_snapshot = EXCLUDED.reorder_point_snapshot,
    needed_quantity = EXCLUDED.needed_quantity,
    suggested_quantity = EXCLUDED.suggested_quantity,
    approved_quantity = EXCLUDED.approved_quantity,
    unit_cost = EXCLUDED.unit_cost,
    prior_average_unit_cost = EXCLUDED.prior_average_unit_cost,
    estimated_line_savings = EXCLUDED.estimated_line_savings,
    line_total = EXCLUDED.line_total,
    include_in_order = EXCLUDED.include_in_order,
    status = EXCLUDED.status,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO purchase_orders (
  id,
  organization_id,
  facility_id,
  vendor_id,
  po_number,
  po_date,
  expected_delivery_date,
  status,
  total_amount,
  estimated_savings,
  currency,
  confirmation_number,
  mock_supplier_submission
)
SELECT
  'e6000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  v.id,
  'PO-LH-SECURITY-B',
  CURRENT_TIMESTAMP,
  CURRENT_DATE + INTERVAL '2 days',
  'submitted',
  10,
  2,
  'USD',
  'MOCK-SECURITY-B',
  TRUE
FROM vendors v
WHERE v.organization_id = 'e0000000-0000-0000-0000-000000000001'
  AND v.vendor_code = 'PATTERSON_DENTAL'
ON CONFLICT (id) DO UPDATE
SET organization_id = EXCLUDED.organization_id,
    facility_id = EXCLUDED.facility_id,
    vendor_id = EXCLUDED.vendor_id,
    status = EXCLUDED.status,
    total_amount = EXCLUDED.total_amount,
    estimated_savings = EXCLUDED.estimated_savings,
    confirmation_number = EXCLUDED.confirmation_number,
    mock_supplier_submission = EXCLUDED.mock_supplier_submission,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO purchase_order_items (
  id,
  purchase_order_id,
  organization_id,
  product_id,
  quantity_ordered,
  quantity_received,
  unit_price,
  line_total,
  uom,
  status
)
SELECT
  'e6100000-0000-0000-0000-000000000001',
  'e6000000-0000-0000-0000-000000000001',
  p.organization_id,
  p.id,
  9,
  0,
  10,
  90,
  'box',
  'open'
FROM products p
WHERE p.organization_id = 'e0000000-0000-0000-0000-000000000001'
  AND p.sku = 'TENANT-B-GLOVES'
ON CONFLICT (id) DO UPDATE
SET purchase_order_id = EXCLUDED.purchase_order_id,
    organization_id = EXCLUDED.organization_id,
    product_id = EXCLUDED.product_id,
    quantity_ordered = EXCLUDED.quantity_ordered,
    quantity_received = EXCLUDED.quantity_received,
    unit_price = EXCLUDED.unit_price,
    line_total = EXCLUDED.line_total,
    uom = EXCLUDED.uom,
    status = EXCLUDED.status,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

DO $$
BEGIN
  BEGIN
    PERFORM *
    FROM lighthouse_generate_suggested_orders('e3000000-0000-0000-0000-000000000001', NULL);
    RAISE EXCEPTION 'Expected User A to be blocked from generating Tenant B suggested orders';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM lighthouse_approve_suggested_order('e5000000-0000-0000-0000-000000000001', NULL);
    RAISE EXCEPTION 'Expected User A to be blocked from approving Tenant B suggested order';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END $$;

DO $$
DECLARE
  visible_tenant_b_rows INT;
BEGIN
  SELECT count(*)
  INTO visible_tenant_b_rows
  FROM lighthouse_low_stock_products
  WHERE organization_id = 'e0000000-0000-0000-0000-000000000001';

  IF visible_tenant_b_rows <> 0 THEN
    RAISE EXCEPTION 'Expected User A to see 0 Tenant B low-stock rows, saw %', visible_tenant_b_rows;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO receiving_events (
      organization_id,
      facility_id,
      location_id,
      purchase_order_id,
      purchase_order_item_id,
      product_id,
      received_quantity,
      received_by,
      notes
    )
    VALUES (
      'e0000000-0000-0000-0000-000000000001',
      'e1000000-0000-0000-0000-000000000001',
      'e3000000-0000-0000-0000-000000000001',
      'e6000000-0000-0000-0000-000000000001',
      'e6100000-0000-0000-0000-000000000001',
      'e4500000-0000-0000-0000-000000000001',
      1,
      'a0000000-0000-0000-0000-000000000001',
      'Expected to fail: cross-tenant receiving insert.'
    );
    RAISE EXCEPTION 'Expected User A to be blocked from inserting Tenant B receiving event';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END $$;

DO $$
DECLARE
  order_id UUID;
  spoofed_actor_id UUID := 'b0000000-0000-0000-0000-000000000001';
  stored_actor_id UUID;
  po_id UUID;
  receipt RECORD;
  receipt_event_id UUID;
  stamped_received_by UUID;
  before_quantity DECIMAL(12, 2);
  after_quantity DECIMAL(12, 2);
BEGIN
  SELECT out_suggested_order_id
  INTO order_id
  FROM lighthouse_generate_suggested_orders(NULL, spoofed_actor_id)
  LIMIT 1;

  IF order_id IS NULL THEN
    RAISE EXCEPTION 'Expected User A to generate at least one same-tenant suggested order';
  END IF;

  SELECT created_by INTO stored_actor_id
  FROM suggested_orders
  WHERE id = order_id;

  IF stored_actor_id <> 'a0000000-0000-0000-0000-000000000001' THEN
    RAISE EXCEPTION 'Expected created_by to use auth.uid(), got %', stored_actor_id;
  END IF;

  po_id := lighthouse_approve_suggested_order(order_id, spoofed_actor_id);

  SELECT
    po.organization_id,
    po.facility_id,
    so.location_id,
    po.id AS purchase_order_id,
    poi.id AS purchase_order_item_id,
    poi.product_id
  INTO receipt
  FROM purchase_orders po
  JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
  JOIN suggested_orders so ON so.id = po.suggested_order_id
  WHERE po.id = po_id
  LIMIT 1;

  SELECT current_quantity
  INTO before_quantity
  FROM inventory_levels
  WHERE organization_id = receipt.organization_id
    AND facility_id = receipt.facility_id
    AND location_id = receipt.location_id
    AND product_id = receipt.product_id
    AND deleted_at IS NULL;

  BEGIN
    INSERT INTO receiving_events (
      organization_id,
      facility_id,
      location_id,
      purchase_order_id,
      purchase_order_item_id,
      product_id,
      received_quantity,
      received_by,
      notes
    )
    VALUES (
      receipt.organization_id,
      receipt.facility_id,
      receipt.location_id,
      receipt.purchase_order_id,
      receipt.purchase_order_item_id,
      receipt.product_id,
      1,
      'b0000000-0000-0000-0000-000000000001',
      'Expected to fail: authenticated user cannot spoof received_by.'
    );
    RAISE EXCEPTION 'Expected User A to be blocked from spoofing received_by';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  INSERT INTO receiving_events (
    organization_id,
    facility_id,
    location_id,
    purchase_order_id,
    purchase_order_item_id,
    product_id,
    received_quantity,
    received_by,
    notes
  )
  VALUES (
    receipt.organization_id,
    receipt.facility_id,
    receipt.location_id,
    receipt.purchase_order_id,
    receipt.purchase_order_item_id,
    receipt.product_id,
    1,
    NULL,
    'Security validation same-tenant receiving event.'
  )
  RETURNING id, received_by
  INTO receipt_event_id, stamped_received_by;

  IF stamped_received_by <> 'a0000000-0000-0000-0000-000000000001' THEN
    RAISE EXCEPTION 'Expected received_by to be stamped from auth.uid(), got %', stamped_received_by;
  END IF;

  BEGIN
    UPDATE receiving_events
    SET notes = 'Expected to fail: receiving events are append-only.'
    WHERE id = receipt_event_id;
    RAISE EXCEPTION 'Expected User A to be blocked from updating receiving event %', receipt_event_id;
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  BEGIN
    DELETE FROM receiving_events
    WHERE id = receipt_event_id;
    RAISE EXCEPTION 'Expected User A to be blocked from deleting receiving event %', receipt_event_id;
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  SELECT current_quantity
  INTO after_quantity
  FROM inventory_levels
  WHERE organization_id = receipt.organization_id
    AND facility_id = receipt.facility_id
    AND location_id = receipt.location_id
    AND product_id = receipt.product_id
    AND deleted_at IS NULL;

  IF after_quantity <> before_quantity + 1 THEN
    RAISE EXCEPTION 'Expected receiving event to increment inventory from % to %, got %',
      before_quantity,
      before_quantity + 1,
      after_quantity;
  END IF;
END $$;

RESET ROLE;
SET ROLE service_role;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claim.role', 'service_role', true);

DO $$
DECLARE
  before_quantity DECIMAL(12, 2);
  after_quantity DECIMAL(12, 2);
BEGIN
  SELECT current_quantity
  INTO before_quantity
  FROM inventory_levels
  WHERE organization_id = 'e0000000-0000-0000-0000-000000000001'
    AND facility_id = 'e1000000-0000-0000-0000-000000000001'
    AND location_id = 'e3000000-0000-0000-0000-000000000001'
    AND product_id = 'e4500000-0000-0000-0000-000000000001'
    AND deleted_at IS NULL;

  BEGIN
    INSERT INTO receiving_events (
      organization_id,
      facility_id,
      location_id,
      purchase_order_id,
      purchase_order_item_id,
      product_id,
      received_quantity,
      received_by,
      notes
    )
    VALUES (
      'e0000000-0000-0000-0000-000000000001',
      'e1000000-0000-0000-0000-000000000001',
      'e3000000-0000-0000-0000-000000000001',
      'e6000000-0000-0000-0000-000000000001',
      'e6100000-0000-0000-0000-000000000001',
      'e4500000-0000-0000-0000-000000000001',
      1,
      'a0000000-0000-0000-0000-000000000001',
      'Expected to fail: service-role receiving cannot attribute to a cross-tenant user.'
    );
    RAISE EXCEPTION 'Expected service_role to be blocked from cross-tenant received_by attribution';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  INSERT INTO receiving_events (
    organization_id,
    facility_id,
    location_id,
    purchase_order_id,
    purchase_order_item_id,
    product_id,
    received_quantity,
    received_by,
    notes
  )
  VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    'e3000000-0000-0000-0000-000000000001',
    'e6000000-0000-0000-0000-000000000001',
    'e6100000-0000-0000-0000-000000000001',
    'e4500000-0000-0000-0000-000000000001',
    1,
    'b0000000-0000-0000-0000-000000000001',
    'Security validation service-role receiving event.'
  );

  SELECT current_quantity
  INTO after_quantity
  FROM inventory_levels
  WHERE organization_id = 'e0000000-0000-0000-0000-000000000001'
    AND facility_id = 'e1000000-0000-0000-0000-000000000001'
    AND location_id = 'e3000000-0000-0000-0000-000000000001'
    AND product_id = 'e4500000-0000-0000-0000-000000000001'
    AND deleted_at IS NULL;

  IF after_quantity <> before_quantity + 1 THEN
    RAISE EXCEPTION 'Expected service-role receiving to increment Tenant B inventory from % to %, got %',
      before_quantity,
      before_quantity + 1,
      after_quantity;
  END IF;
END $$;

RESET ROLE;
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claim.role', 'anon', true);

DO $$
BEGIN
  BEGIN
    PERFORM * FROM lighthouse_generate_suggested_orders(NULL, NULL);
    RAISE EXCEPTION 'Expected anonymous user to be blocked from generating suggested orders';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM lighthouse_approve_suggested_order('00000000-0000-0000-0000-000000000000', NULL);
    RAISE EXCEPTION 'Expected anonymous user to be blocked from approving suggested orders';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END $$;

RESET ROLE;

ROLLBACK;
