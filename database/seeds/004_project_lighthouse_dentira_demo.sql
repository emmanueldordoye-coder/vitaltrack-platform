-- VitalTrack Platform - Project Lighthouse Dentira Demo Seed
-- Created: 2026-07-09
-- Purpose: Dental office ordering demo data using Patterson Dental as mock supplier
--
-- Run after:
-- 1. database/migrations/001_init_schema.sql
-- 2. database/migrations/002_product_master_catalog.sql
-- 3. database/migrations/003_project_lighthouse_ordering_workflow.sql

BEGIN;

-- ============================================================================
-- Demo Tenant and Facility
-- ============================================================================

INSERT INTO organizations (id, name, slug, description, tier, status)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'Dentira Dental Group',
  'dentira-demo',
  'Project Lighthouse dental office demo tenant',
  'professional',
  'active'
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO facilities (
  id,
  organization_id,
  name,
  facility_type,
  address,
  city,
  state,
  postal_code,
  country,
  timezone,
  is_active
)
VALUES (
  'd1000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Dentira Main Office',
  'dental_office',
  '1200 Lighthouse Way',
  'Austin',
  'TX',
  '78701',
  'USA',
  'America/Chicago',
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  facility_type = EXCLUDED.facility_type,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  postal_code = EXCLUDED.postal_code,
  country = EXCLUDED.country,
  timezone = EXCLUDED.timezone,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO departments (
  id,
  facility_id,
  name,
  department_code,
  description,
  is_active
)
VALUES
  (
    'd2000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'Clinical Operations',
    'CLINICAL',
    'Operatories, hygiene, and sterilization supply management',
    TRUE
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  department_code = EXCLUDED.department_code,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Locations
-- ============================================================================

INSERT INTO locations (
  id,
  facility_id,
  department_id,
  name,
  location_code,
  location_type,
  parent_location_id,
  capacity_units,
  is_active
)
VALUES
  (
    'd3000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001',
    'Main Supply Stockroom',
    'MAIN-STOCK',
    'room',
    NULL,
    600,
    TRUE
  ),
  (
    'd3000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001',
    'Hygiene Bay',
    'HYG-BAY',
    'cabinet',
    NULL,
    200,
    TRUE
  ),
  (
    'd3000000-0000-0000-0000-000000000003',
    'd1000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001',
    'Sterilization Room',
    'STER-ROOM',
    'room',
    NULL,
    300,
    TRUE
  ),
  (
    'd3000000-0000-0000-0000-000000000004',
    'd1000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001',
    'Operatory Closet',
    'OP-CLOSET',
    'cabinet',
    NULL,
    240,
    TRUE
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  location_code = EXCLUDED.location_code,
  location_type = EXCLUDED.location_type,
  capacity_units = EXCLUDED.capacity_units,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Product Master Catalog Rows
-- ============================================================================

INSERT INTO vendors (
  id,
  organization_id,
  name,
  vendor_code,
  contact_name,
  email,
  phone,
  website,
  payment_terms,
  is_active,
  metadata
)
VALUES (
  'd4000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Patterson Dental',
  'PATTERSON_DENTAL',
  'Patterson Demo Ordering Desk',
  'orders@patterson-demo.example',
  '1-800-555-0199',
  'https://www.pattersondental.com',
  'Net 30',
  TRUE,
  '{"demo_account_number":"PAT-DEMO-48291","mock_supplier":true}'::jsonb
)
ON CONFLICT (organization_id, vendor_code) DO UPDATE
SET
  name = EXCLUDED.name,
  contact_name = EXCLUDED.contact_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  website = EXCLUDED.website,
  payment_terms = EXCLUDED.payment_terms,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO units_of_measure (
  organization_id,
  base_unit_id,
  code,
  name,
  dimension,
  allows_decimal,
  is_base_unit,
  conversion_factor
)
VALUES
  ('d0000000-0000-0000-0000-000000000001', NULL, 'box', 'Box', 'count', FALSE, TRUE, 1),
  ('d0000000-0000-0000-0000-000000000001', NULL, 'bag', 'Bag', 'count', FALSE, TRUE, 1),
  ('d0000000-0000-0000-0000-000000000001', NULL, 'case', 'Case', 'count', FALSE, TRUE, 1)
ON CONFLICT (organization_id, code) DO UPDATE
SET
  name = EXCLUDED.name,
  dimension = EXCLUDED.dimension,
  allows_decimal = EXCLUDED.allows_decimal,
  is_base_unit = EXCLUDED.is_base_unit,
  conversion_factor = EXCLUDED.conversion_factor,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (
  organization_id,
  parent_category_id,
  name,
  slug,
  category_code,
  description,
  sort_order,
  is_active
)
VALUES
  ('d0000000-0000-0000-0000-000000000001', NULL, 'Personal Protection', 'personal-protection', 'DENT-PPE', 'Gloves and PPE for dental care', 10, TRUE),
  ('d0000000-0000-0000-0000-000000000001', NULL, 'Evacuation', 'evacuation', 'DENT-EVAC', 'Evacuation and suction supplies', 20, TRUE),
  ('d0000000-0000-0000-0000-000000000001', NULL, 'Preventive', 'preventive', 'DENT-PREV', 'Preventive hygiene supplies', 30, TRUE),
  ('d0000000-0000-0000-0000-000000000001', NULL, 'Sterilization', 'sterilization', 'DENT-STER', 'Sterilization supplies', 40, TRUE),
  ('d0000000-0000-0000-0000-000000000001', NULL, 'Operatory', 'operatory', 'DENT-OP', 'Operatory consumables', 50, TRUE),
  ('d0000000-0000-0000-0000-000000000001', NULL, 'Patient Care', 'patient-care', 'DENT-PAT', 'Patient care supplies', 60, TRUE)
ON CONFLICT (organization_id, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  category_code = EXCLUDED.category_code,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

WITH product_seed AS (
  SELECT *
  FROM (
    VALUES
      (
        'PAT-GLV-NIT-M',
        'Nitrile Exam Gloves, Medium',
        'Powder-free nitrile exam gloves for dental operatories.',
        'personal-protection',
        'box',
        'PDS-GLV-NIT-M',
        '{"primary_vendor_code":"PATTERSON_DENTAL","vendor_sku":"PDS-GLV-NIT-M","unit_cost":7.35,"prior_average_unit_cost":8.20,"minimum_order_quantity":10,"order_multiple":5}'::jsonb
      ),
      (
        'PAT-SAL-EJ-100',
        'Disposable Saliva Ejectors',
        'Flexible disposable saliva ejectors for chairside evacuation.',
        'evacuation',
        'bag',
        'PDS-SAL-EJ-100',
        '{"primary_vendor_code":"PATTERSON_DENTAL","vendor_sku":"PDS-SAL-EJ-100","unit_cost":5.90,"prior_average_unit_cost":6.55,"minimum_order_quantity":12,"order_multiple":6}'::jsonb
      ),
      (
        'PAT-PRO-ANGLE',
        'Disposable Prophy Angles, Soft Cup',
        'Disposable prophy angles with soft cup for hygiene visits.',
        'preventive',
        'box',
        'PDS-PRO-ANGLE',
        '{"primary_vendor_code":"PATTERSON_DENTAL","vendor_sku":"PDS-PRO-ANGLE","unit_cost":31.50,"prior_average_unit_cost":34.75,"minimum_order_quantity":4,"order_multiple":2}'::jsonb
      ),
      (
        'PAT-STER-3510',
        'Sterilization Pouches 3.5 x 10',
        'Self-sealing sterilization pouches for dental instruments.',
        'sterilization',
        'box',
        'PDS-STER-3510',
        '{"primary_vendor_code":"PATTERSON_DENTAL","vendor_sku":"PDS-STER-3510","unit_cost":18.25,"prior_average_unit_cost":20.10,"minimum_order_quantity":6,"order_multiple":3}'::jsonb
      ),
      (
        'PAT-AW-TIPS',
        'Air/Water Syringe Tips',
        'Disposable air/water syringe tips for dental operatories.',
        'operatory',
        'bag',
        'PDS-AW-TIPS',
        '{"primary_vendor_code":"PATTERSON_DENTAL","vendor_sku":"PDS-AW-TIPS","unit_cost":16.40,"prior_average_unit_cost":18.15,"minimum_order_quantity":6,"order_multiple":3}'::jsonb
      ),
      (
        'PAT-BIB-2PLY',
        'Dental Bibs, 2-Ply Poly',
        'Disposable dental bibs with poly backing.',
        'patient-care',
        'case',
        'PDS-BIB-2PLY',
        '{"primary_vendor_code":"PATTERSON_DENTAL","vendor_sku":"PDS-BIB-2PLY","unit_cost":42.80,"prior_average_unit_cost":45.20,"minimum_order_quantity":2,"order_multiple":1}'::jsonb
      ),
      (
        'PAT-FLUOR-VARN',
        'Fluoride Varnish Unit Dose',
        'Unit-dose fluoride varnish for preventive care.',
        'preventive',
        'box',
        'PDS-FLUOR-VARN',
        '{"primary_vendor_code":"PATTERSON_DENTAL","vendor_sku":"PDS-FLUOR-VARN","unit_cost":62.25,"prior_average_unit_cost":64.40,"minimum_order_quantity":2,"order_multiple":1}'::jsonb
      )
  ) AS seed(sku, name, description, category_slug, uom_code, manufacturer_part_number, metadata)
),
resolved AS (
  SELECT
    'd0000000-0000-0000-0000-000000000001'::uuid AS organization_id,
    c.id AS category_id,
    u.id AS unit_of_measure_id,
    ps.sku,
    ps.name,
    ps.description,
    ps.manufacturer_part_number,
    ps.metadata
  FROM product_seed ps
  JOIN categories c
    ON c.organization_id = 'd0000000-0000-0000-0000-000000000001'
   AND c.slug = ps.category_slug
  JOIN units_of_measure u
    ON u.organization_id = 'd0000000-0000-0000-0000-000000000001'
   AND u.code = ps.uom_code
)
INSERT INTO products (
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
  organization_id,
  category_id,
  unit_of_measure_id,
  sku,
  name,
  description,
  manufacturer_part_number,
  'supply',
  'active',
  TRUE,
  metadata
FROM resolved
ON CONFLICT (organization_id, sku) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  unit_of_measure_id = EXCLUDED.unit_of_measure_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  manufacturer_part_number = EXCLUDED.manufacturer_part_number,
  product_type = EXCLUDED.product_type,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Inventory Levels
-- ============================================================================

WITH inventory_seed AS (
  SELECT *
  FROM (
    VALUES
      ('PAT-GLV-NIT-M', 'd3000000-0000-0000-0000-000000000001'::uuid, 18, 60, 30),
      ('PAT-SAL-EJ-100', 'd3000000-0000-0000-0000-000000000004'::uuid, 24, 72, 36),
      ('PAT-PRO-ANGLE', 'd3000000-0000-0000-0000-000000000002'::uuid, 5, 18, 10),
      ('PAT-STER-3510', 'd3000000-0000-0000-0000-000000000003'::uuid, 8, 30, 15),
      ('PAT-AW-TIPS', 'd3000000-0000-0000-0000-000000000004'::uuid, 11, 36, 18),
      ('PAT-BIB-2PLY', 'd3000000-0000-0000-0000-000000000001'::uuid, 4, 8, 4),
      ('PAT-FLUOR-VARN', 'd3000000-0000-0000-0000-000000000002'::uuid, 10, 12, 6)
  ) AS seed(product_sku, location_id, current_quantity, par_level, reorder_point)
),
resolved_inventory AS (
  SELECT
    'd0000000-0000-0000-0000-000000000001'::uuid AS organization_id,
    'd1000000-0000-0000-0000-000000000001'::uuid AS facility_id,
    seed.location_id,
    p.id AS product_id,
    seed.current_quantity,
    seed.par_level,
    seed.reorder_point
  FROM inventory_seed seed
  JOIN products p
    ON p.organization_id = 'd0000000-0000-0000-0000-000000000001'
   AND p.sku = seed.product_sku
)
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
  organization_id,
  facility_id,
  location_id,
  product_id,
  current_quantity,
  par_level,
  reorder_point,
  CURRENT_TIMESTAMP
FROM resolved_inventory
ON CONFLICT (organization_id, product_id, location_id) WHERE deleted_at IS NULL DO UPDATE
SET
  current_quantity = EXCLUDED.current_quantity,
  par_level = EXCLUDED.par_level,
  reorder_point = EXCLUDED.reorder_point,
  deleted_at = NULL,
  last_counted_at = EXCLUDED.last_counted_at,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
