-- VitalTrack Platform - Dental Supplies Seed (Project Lighthouse Demo)
-- Created: 2026-07-09
-- Description: Realistic dental office supplies from Patterson Dental.
--              Seeds a supplier, 10 inventory items, stock levels (5 low),
--              and reorder rules so the suggested-order workflow can run.
--
-- Prerequisites: 001_init_schema.sql + 002_product_master_catalog.sql +
--               003_procurement_workflow.sql must already be applied.
--
-- Target: uses the existing demo organization and facility from 002_seed_data.sql.
--   org_id      = '123e4567-e89b-12d3-a456-426614174000' (Metropolitan Hospital Group)
--   facility_id = 'f1000000-0000-0000-0000-000000000001' (Metro Central Hospital)
--   location_id = 'a1000000-0000-0000-0000-000000000001' (ED Storage Room 1)
--
-- To use a different organization, replace the UUIDs in the WITH clause below.

BEGIN;

-- ============================================================================
-- Patterson Dental — Supplier
-- ============================================================================

INSERT INTO suppliers (
  id,
  organization_id,
  name,
  supplier_code,
  contact_name,
  email,
  phone,
  city,
  state,
  country,
  website,
  payment_terms,
  lead_time_days,
  is_active
)
VALUES (
  'd2000000-0000-0000-0000-000000000001',
  '123e4567-e89b-12d3-a456-426614174000',
  'Patterson Dental Supply',
  'PATTERSON',
  'Sales Team',
  'orders@pattersoncompanies.com',
  '1-800-873-7683',
  'Saint Paul',
  'MN',
  'USA',
  'https://www.pattersondental.com',
  'Net 30',
  3,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET
  name          = EXCLUDED.name,
  contact_name  = EXCLUDED.contact_name,
  email         = EXCLUDED.email,
  phone         = EXCLUDED.phone,
  website       = EXCLUDED.website,
  payment_terms = EXCLUDED.payment_terms,
  lead_time_days = EXCLUDED.lead_time_days,
  updated_at    = CURRENT_TIMESTAMP;

-- ============================================================================
-- Dental Inventory Items
-- ============================================================================
-- Realistic Patterson Dental products with SKUs, costs, and tracking flags.

INSERT INTO inventory_items (
  id,
  organization_id,
  sku,
  name,
  category,
  subcategory,
  description,
  uom,
  unit_cost,
  currency,
  supplier_id,
  manufacturer,
  track_expiration,
  expiration_alert_days,
  is_active
)
VALUES
  -- 1. Exam Gloves
  (
    'd3000000-0000-0000-0000-000000000001',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-GLOVE-LG',
    'Cranberry Nitrile Exam Gloves – Large (100/box)',
    'Dental Supplies',
    'PPE',
    'Powder-free, latex-free nitrile exam gloves. Size Large, 100 gloves per box.',
    'box',
    18.95,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Cranberry USA',
    FALSE,
    0,
    TRUE
  ),
  -- 2. Procedure Masks
  (
    'd3000000-0000-0000-0000-000000000002',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-MASK-LVL2',
    'Crosstex ASTM Level 2 Procedure Masks (50/box)',
    'Dental Supplies',
    'PPE',
    'ASTM Level 2 fluid-resistant procedure masks. 50 per box.',
    'box',
    12.50,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Crosstex International',
    FALSE,
    0,
    TRUE
  ),
  -- 3. Cotton Rolls
  (
    'd3000000-0000-0000-0000-000000000003',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-CROLL-2',
    'Patterson Cotton Rolls #2 (2000/bag)',
    'Dental Supplies',
    'Consumables',
    'Non-sterile cotton rolls, size #2. 2000 per bag.',
    'bag',
    9.75,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Patterson Dental',
    FALSE,
    0,
    TRUE
  ),
  -- 4. Patient Bibs
  (
    'd3000000-0000-0000-0000-000000000004',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-BIBS-500',
    'Tidi Patient Bibs 2-Ply (500/box)',
    'Dental Supplies',
    'Consumables',
    'Disposable 2-ply tissue/poly patient bibs. 500 per box.',
    'box',
    24.00,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Tidi Products',
    FALSE,
    0,
    TRUE
  ),
  -- 5. Lidocaine (tracked expiration — controlled substance)
  (
    'd3000000-0000-0000-0000-000000000005',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-LIDO-100K',
    '2% Lidocaine HCl 1:100,000 Epi Cartridges (50/box)',
    'Dental Supplies',
    'Anesthetics',
    'Lidocaine HCl 2% with epinephrine 1:100,000. 1.8 mL cartridges, 50 per box.',
    'box',
    46.95,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Dentsply Sirona',
    TRUE,
    90,
    TRUE
  ),
  -- 6. Prophy Paste
  (
    'd3000000-0000-0000-0000-000000000006',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-PROPHY-MED',
    'Dentsply Nupro Prophy Paste – Medium Grit (200/jar)',
    'Dental Supplies',
    'Prophylaxis',
    'Fluoride prophy paste, medium grit, mint flavor. Jar of 200 unit-dose cups.',
    'jar',
    15.00,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Dentsply Sirona',
    FALSE,
    0,
    TRUE
  ),
  -- 7. Composite Resin
  (
    'd3000000-0000-0000-0000-000000000007',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-COMP-A2',
    '3M Filtek Z350 Universal Composite – Shade A2 (4g syringe)',
    'Dental Supplies',
    'Restorative',
    'Universal nanofill composite resin, shade A2. Single 4g syringe.',
    'syringe',
    42.00,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    '3M Dental Products',
    FALSE,
    0,
    TRUE
  ),
  -- 8. Alginate
  (
    'd3000000-0000-0000-0000-000000000008',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-ALGI-1LB',
    'Patterson Chromatic Alginate Impression Material – 1 lb can',
    'Dental Supplies',
    'Impressions',
    'Color-changing alginate, fast set. 1 lb (454g) can.',
    'can',
    8.95,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Patterson Dental',
    FALSE,
    0,
    TRUE
  ),
  -- 9. Saliva Ejectors
  (
    'd3000000-0000-0000-0000-000000000009',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-SAEJ-100',
    'Disposable Saliva Ejectors – White (100/bag)',
    'Dental Supplies',
    'Consumables',
    'Flexible white saliva ejectors, standard tip. 100 per bag.',
    'bag',
    5.25,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Patterson Dental',
    FALSE,
    0,
    TRUE
  ),
  -- 10. Impression Trays
  (
    'd3000000-0000-0000-0000-000000000010',
    '123e4567-e89b-12d3-a456-426614174000',
    'PTT-TRAY-UL',
    'Disposable Impression Trays – Upper Large (12/pkg)',
    'Dental Supplies',
    'Impressions',
    'Perforated rigid plastic impression trays, upper arch, large. 12 per package.',
    'pkg',
    11.50,
    'USD',
    'd2000000-0000-0000-0000-000000000001',
    'Dentsply Sirona',
    FALSE,
    0,
    TRUE
  )
ON CONFLICT (organization_id, sku) DO UPDATE
SET
  name               = EXCLUDED.name,
  category           = EXCLUDED.category,
  subcategory        = EXCLUDED.subcategory,
  description        = EXCLUDED.description,
  uom                = EXCLUDED.uom,
  unit_cost          = EXCLUDED.unit_cost,
  supplier_id        = EXCLUDED.supplier_id,
  manufacturer       = EXCLUDED.manufacturer,
  track_expiration   = EXCLUDED.track_expiration,
  expiration_alert_days = EXCLUDED.expiration_alert_days,
  updated_at         = CURRENT_TIMESTAMP;

-- ============================================================================
-- Stock Levels
-- ============================================================================
-- Items 1-3, 5, 9 are intentionally BELOW reorder_level to trigger detection.
-- All placed in ED Storage Room 1 (existing demo location).

INSERT INTO stock_levels (
  facility_id,
  inventory_item_id,
  location_id,
  available_quantity,
  min_level,
  max_level,
  reorder_level,
  reorder_quantity,
  lead_time_days,
  last_counted
)
VALUES
  -- Gloves: 3 on hand, reorder at 8 → LOW STOCK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 3,  5,  20, 8,  15, 3, CURRENT_TIMESTAMP),
  -- Masks: 2 on hand, reorder at 5 → LOW STOCK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 2,  3,  15, 5,  10, 3, CURRENT_TIMESTAMP),
  -- Cotton Rolls: 1 on hand, reorder at 3 → LOW STOCK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 1,  2,  10, 3,  8,  3, CURRENT_TIMESTAMP),
  -- Patient Bibs: 8 on hand, reorder at 4 → OK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 8,  2,  15, 4,  10, 3, CURRENT_TIMESTAMP),
  -- Lidocaine: 1 on hand, reorder at 3 → LOW STOCK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 1,  2,  10, 3,  8,  3, CURRENT_TIMESTAMP),
  -- Prophy Paste: 5 on hand, reorder at 2 → OK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 5,  1,  8,  2,  5,  3, CURRENT_TIMESTAMP),
  -- Composite Resin: 6 on hand, reorder at 3 → OK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 6,  2,  12, 3,  6,  3, CURRENT_TIMESTAMP),
  -- Alginate: 4 on hand, reorder at 2 → OK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 4,  1,  8,  2,  5,  3, CURRENT_TIMESTAMP),
  -- Saliva Ejectors: 3 on hand, reorder at 6 → LOW STOCK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 3,  5,  20, 6,  12, 3, CURRENT_TIMESTAMP),
  -- Impression Trays: 3 on hand, reorder at 2 → OK
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 3,  1,  8,  2,  5,  3, CURRENT_TIMESTAMP)
ON CONFLICT (facility_id, inventory_item_id, location_id) DO UPDATE
SET
  available_quantity = EXCLUDED.available_quantity,
  min_level          = EXCLUDED.min_level,
  max_level          = EXCLUDED.max_level,
  reorder_level      = EXCLUDED.reorder_level,
  reorder_quantity   = EXCLUDED.reorder_quantity,
  lead_time_days     = EXCLUDED.lead_time_days,
  last_counted       = EXCLUDED.last_counted,
  updated_at         = CURRENT_TIMESTAMP;

-- ============================================================================
-- Reorder Rules
-- ============================================================================
-- All dental items re-order from Patterson Dental.

INSERT INTO reorder_rules (
  facility_id,
  inventory_item_id,
  supplier_id,
  min_quantity,
  max_quantity,
  reorder_quantity,
  lead_time_days,
  is_active,
  auto_order
)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 5,  20, 15, 3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 3,  15, 10, 3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000001', 2,  10, 8,  3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000001', 2,  15, 10, 3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000001', 2,  10, 8,  3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000006', 'd2000000-0000-0000-0000-000000000001', 1,  8,  5,  3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000007', 'd2000000-0000-0000-0000-000000000001', 2,  12, 6,  3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000008', 'd2000000-0000-0000-0000-000000000001', 1,  8,  5,  3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000009', 'd2000000-0000-0000-0000-000000000001', 5,  20, 12, 3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000010', 'd2000000-0000-0000-0000-000000000001', 1,  8,  5,  3, TRUE, FALSE)
ON CONFLICT (facility_id, inventory_item_id) DO UPDATE
SET
  supplier_id      = EXCLUDED.supplier_id,
  min_quantity     = EXCLUDED.min_quantity,
  max_quantity     = EXCLUDED.max_quantity,
  reorder_quantity = EXCLUDED.reorder_quantity,
  lead_time_days   = EXCLUDED.lead_time_days,
  is_active        = EXCLUDED.is_active,
  updated_at       = CURRENT_TIMESTAMP;

COMMIT;
