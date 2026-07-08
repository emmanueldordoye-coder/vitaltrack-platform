-- VitalTrack Platform - Product Master Catalog Seed Template
-- Created: 2026-07-08
-- Purpose: Template rows for categories, manufacturers, vendors, units_of_measure, and products
--
-- Usage:
-- 1. Replace the organization slug in org_context with a real tenant slug.
-- 2. Update the example rows to match your catalog.
-- 3. Run after 001_init_schema.sql and 002_product_master_catalog.sql.

BEGIN;

WITH org_context AS (
  SELECT id AS organization_id
  FROM organizations
  WHERE slug = 'replace-with-organization-slug'
)
INSERT INTO categories (
  organization_id,
  parent_category_id,
  name,
  slug,
  category_code,
  description,
  sort_order
)
SELECT
  oc.organization_id,
  NULL,
  seed.name,
  seed.slug,
  seed.category_code,
  seed.description,
  seed.sort_order
FROM org_context oc
JOIN (
  VALUES
    ('Medications', 'medications', 'MED', 'Top-level medication catalog', 10),
    ('Medical Supplies', 'medical-supplies', 'SUP', 'Top-level consumables catalog', 20)
) AS seed(name, slug, category_code, description, sort_order)
  ON TRUE
ON CONFLICT (organization_id, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  category_code = EXCLUDED.category_code,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = CURRENT_TIMESTAMP;

WITH org_context AS (
  SELECT id AS organization_id
  FROM organizations
  WHERE slug = 'replace-with-organization-slug'
)
INSERT INTO manufacturers (
  organization_id,
  name,
  manufacturer_code,
  website,
  country
)
SELECT
  oc.organization_id,
  seed.name,
  seed.manufacturer_code,
  seed.website,
  seed.country
FROM org_context oc
JOIN (
  VALUES
    ('Example Pharma', 'EXPHARMA', 'https://examplepharma.invalid', 'USA'),
    ('Clinical Supply Co', 'CLINSUP', 'https://clinicalsupply.invalid', 'USA')
) AS seed(name, manufacturer_code, website, country)
  ON TRUE
ON CONFLICT (organization_id, manufacturer_code) DO UPDATE
SET
  name = EXCLUDED.name,
  website = EXCLUDED.website,
  country = EXCLUDED.country,
  updated_at = CURRENT_TIMESTAMP;

WITH org_context AS (
  SELECT id AS organization_id
  FROM organizations
  WHERE slug = 'replace-with-organization-slug'
)
INSERT INTO vendors (
  organization_id,
  name,
  vendor_code,
  contact_name,
  email,
  phone,
  payment_terms
)
SELECT
  oc.organization_id,
  seed.name,
  seed.vendor_code,
  seed.contact_name,
  seed.email,
  seed.phone,
  seed.payment_terms
FROM org_context oc
JOIN (
  VALUES
    ('Regional Med Distributor', 'RMD', 'Buyer Team', 'orders@example.invalid', '1-800-555-0101', 'Net 30'),
    ('CarePoint Wholesale', 'CPW', 'Purchasing Desk', 'sales@example.invalid', '1-800-555-0102', 'Net 45')
) AS seed(name, vendor_code, contact_name, email, phone, payment_terms)
  ON TRUE
ON CONFLICT (organization_id, vendor_code) DO UPDATE
SET
  name = EXCLUDED.name,
  contact_name = EXCLUDED.contact_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  payment_terms = EXCLUDED.payment_terms,
  updated_at = CURRENT_TIMESTAMP;

WITH org_context AS (
  SELECT id AS organization_id
  FROM organizations
  WHERE slug = 'replace-with-organization-slug'
)
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
SELECT
  oc.organization_id,
  NULL,
  seed.code,
  seed.name,
  seed.dimension,
  seed.allows_decimal,
  TRUE,
  1
FROM org_context oc
JOIN (
  VALUES
    ('ea', 'Each', 'count', FALSE),
    ('box', 'Box', 'count', FALSE),
    ('mL', 'Milliliter', 'volume', TRUE)
) AS seed(code, name, dimension, allows_decimal)
  ON TRUE
ON CONFLICT (organization_id, code) DO UPDATE
SET
  name = EXCLUDED.name,
  dimension = EXCLUDED.dimension,
  allows_decimal = EXCLUDED.allows_decimal,
  updated_at = CURRENT_TIMESTAMP;

WITH org_context AS (
  SELECT id AS organization_id
  FROM organizations
  WHERE slug = 'replace-with-organization-slug'
),
resolved_products AS (
  SELECT
    oc.organization_id,
    c.id AS category_id,
    m.id AS manufacturer_id,
    u.id AS unit_of_measure_id,
    seed.sku,
    seed.name,
    seed.description,
    seed.gtin,
    seed.manufacturer_part_number,
    seed.product_type,
    seed.requires_expiration_tracking
  FROM org_context oc
  JOIN (
    VALUES
      ('MED-ASP-500', 'Aspirin 500mg Tablets', 'Example product placeholder', '00012345678905', 'ASP-500', 'medication', TRUE, 'medications', 'EXPHARMA', 'ea'),
      ('SUP-GAUZE-4X4', 'Sterile Gauze 4x4', 'Example supply placeholder', '00012345678912', 'GAUZE-4X4', 'supply', FALSE, 'medical-supplies', 'CLINSUP', 'box')
  ) AS seed(
    sku,
    name,
    description,
    gtin,
    manufacturer_part_number,
    product_type,
    requires_expiration_tracking,
    category_slug,
    manufacturer_code,
    uom_code
  ) ON TRUE
  JOIN categories c
    ON c.organization_id = oc.organization_id
   AND c.slug = seed.category_slug
  JOIN manufacturers m
    ON m.organization_id = oc.organization_id
   AND m.manufacturer_code = seed.manufacturer_code
  JOIN units_of_measure u
    ON u.organization_id = oc.organization_id
   AND u.code = seed.uom_code
)
INSERT INTO products (
  organization_id,
  category_id,
  manufacturer_id,
  unit_of_measure_id,
  sku,
  name,
  description,
  gtin,
  manufacturer_part_number,
  product_type,
  requires_expiration_tracking
)
SELECT
  organization_id,
  category_id,
  manufacturer_id,
  unit_of_measure_id,
  sku,
  name,
  description,
  gtin,
  manufacturer_part_number,
  product_type,
  requires_expiration_tracking
FROM resolved_products
ON CONFLICT (organization_id, sku) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  manufacturer_id = EXCLUDED.manufacturer_id,
  unit_of_measure_id = EXCLUDED.unit_of_measure_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  gtin = EXCLUDED.gtin,
  manufacturer_part_number = EXCLUDED.manufacturer_part_number,
  product_type = EXCLUDED.product_type,
  requires_expiration_tracking = EXCLUDED.requires_expiration_tracking,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
