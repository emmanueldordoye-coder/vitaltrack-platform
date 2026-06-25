-- VitalTrack Platform - Seed Data
-- Created: 2026-06-25
-- Purpose: Development and testing data

-- ============================================================================
-- Organizations
-- ============================================================================

INSERT INTO organizations (id, name, slug, description, tier, status)
VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'Metropolitan Hospital Group', 'metro-hospital', 'Large hospital chain with 15 facilities', 'enterprise', 'active'),
  ('223e4567-e89b-12d3-a456-426614174000', 'Urban Clinic Network', 'urban-clinic', 'Community clinics across the city', 'professional', 'active'),
  ('323e4567-e89b-12d3-a456-426614174000', 'Central Pharmacy', 'central-pharmacy', 'Regional pharmaceutical distributor', 'professional', 'active');

-- ============================================================================
-- Facilities
-- ============================================================================

INSERT INTO facilities (id, organization_id, name, facility_type, address, city, state, postal_code, country, timezone, is_active)
VALUES
  ('f1000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'Metro Central Hospital', 'hospital', '500 Main Street', 'New York', 'NY', '10001', 'USA', 'America/New_York', TRUE),
  ('f2000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'Metro North Clinic', 'clinic', '1200 Broadway', 'New York', 'NY', '10001', 'USA', 'America/New_York', TRUE),
  ('f3000000-0000-0000-0000-000000000001', '223e4567-e89b-12d3-a456-426614174000', 'Urban Downtown', 'clinic', '456 Park Avenue', 'New York', 'NY', '10022', 'USA', 'America/New_York', TRUE),
  ('f4000000-0000-0000-0000-000000000001', '323e4567-e89b-12d3-a456-426614174000', 'Central Warehouse', 'warehouse', '999 Industrial Blvd', 'New Jersey', 'NJ', '07001', 'USA', 'America/New_York', TRUE);

-- ============================================================================
-- Departments
-- ============================================================================

INSERT INTO departments (id, facility_id, name, department_code, description, is_active)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Emergency Department', 'ED', 'Emergency and acute care', TRUE),
  ('d2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Surgical Operations', 'SURG', 'Operating rooms and surgical supplies', TRUE),
  ('d3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Pharmacy', 'PHARM', 'Hospital pharmacy', TRUE),
  ('d4000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Intensive Care Unit', 'ICU', 'Critical care unit', TRUE);

-- ============================================================================
-- Storage Locations
-- ============================================================================

INSERT INTO locations (id, facility_id, department_id, name, location_code, location_type, parent_location_id, capacity_units, is_active)
VALUES
  -- ED Locations
  ('l1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'ED Storage Room 1', 'ED-SR1', 'room', NULL, 500, TRUE),
  ('l2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'ED Cabinet 1A', 'ED-CB-1A', 'cabinet', 'l1000000-0000-0000-0000-000000000001', 100, TRUE),
  ('l3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'ED Refrigerator', 'ED-REF-01', 'cabinet', 'l1000000-0000-0000-0000-000000000001', 50, TRUE),
  
  -- OR Locations
  ('l4000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'OR Supply Storage', 'OR-STOR-01', 'room', NULL, 1000, TRUE),
  ('l5000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'OR Cabinet Sterile', 'OR-ST-01', 'cabinet', 'l4000000-0000-0000-0000-000000000001', 200, TRUE),
  
  -- Pharmacy Locations
  ('l6000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Pharmacy Main Stock', 'PH-MAIN', 'room', NULL, 2000, TRUE),
  ('l7000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Controlled Substances Cabinet', 'PH-CS-01', 'cabinet', 'l6000000-0000-0000-0000-000000000001', 100, TRUE),
  
  -- ICU Locations
  ('l8000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000001', 'ICU Supply Cabinet', 'ICU-CB-01', 'cabinet', NULL, 300, TRUE);

-- ============================================================================
-- Inventory Items
-- ============================================================================

INSERT INTO inventory_items (id, organization_id, sku, name, category, subcategory, uom, unit_cost, track_expiration, is_active)
VALUES
  -- Medications
  ('i1000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'ASPIRIN-500', 'Aspirin 500mg Tablets', 'Medications', 'Cardiovascular', 'box', 5.50, TRUE, TRUE),
  ('i2000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'AMOXIL-250', 'Amoxicillin 250mg Capsules', 'Medications', 'Antibiotics', 'box', 12.00, TRUE, TRUE),
  ('i3000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'INSULIN-NPH', 'Insulin NPH 100 IU/mL', 'Medications', 'Endocrine', 'vial', 35.00, TRUE, TRUE),
  
  -- Medical Supplies
  ('i4000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'GAUZE-4X4', 'Sterile Gauze Pads 4x4 inch', 'Medical Supplies', 'Wound Care', 'box', 8.75, FALSE, TRUE),
  ('i5000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'BANDAGE-1IN', 'Adhesive Bandages 1 inch', 'Medical Supplies', 'Wound Care', 'box', 2.50, FALSE, TRUE),
  ('i6000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'SYRINGE-10ML', '10ml Sterile Syringes', 'Medical Supplies', 'Injection', 'box', 15.00, FALSE, TRUE),
  ('i7000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'IV-LINE-24G', '24G IV Catheter', 'Medical Supplies', 'IV Access', 'box', 22.50, FALSE, TRUE),
  
  -- PPE
  ('i8000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'MASK-SURGICAL', 'Surgical Masks 3-ply', 'PPE', 'Face Protection', 'box', 18.00, FALSE, TRUE),
  ('i9000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'GLOVES-NITRILE', 'Nitrile Gloves Powder-free', 'PPE', 'Hand Protection', 'box', 25.00, FALSE, TRUE),
  
  -- Equipment
  ('i10000000-0000-0000-0000-0000000001', '123e4567-e89b-12d3-a456-426614174000', 'BP-MONITOR', 'Digital Blood Pressure Monitor', 'Equipment', 'Monitoring', 'unit', 85.00, FALSE, TRUE);

-- ============================================================================
-- Suppliers
-- ============================================================================

INSERT INTO suppliers (id, organization_id, name, supplier_code, contact_name, email, phone, city, country, lead_time_days, is_active)
VALUES
  ('s1000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'MedDirect Supplies', 'MEDDIRECT', 'John Smith', 'orders@meddirect.com', '1-800-555-0101', 'Newark', 'USA', 3, TRUE),
  ('s2000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'PharmaHub Solutions', 'PHARMAHUB', 'Sarah Johnson', 'sales@pharmahub.com', '1-800-555-0102', 'Chicago', 'USA', 2, TRUE),
  ('s3000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'Global Med Equipment', 'GLOBEQ', 'Michael Chen', 'purchasing@globeq.com', '1-800-555-0103', 'Los Angeles', 'USA', 5, TRUE);

-- ============================================================================
-- Stock Levels
-- ============================================================================

INSERT INTO stock_levels (facility_id, inventory_item_id, location_id, available_quantity, min_level, max_level, reorder_level, reorder_quantity, lead_time_days, last_counted)
VALUES
  -- ED Stock
  ('f1000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000001', 'l2000000-0000-0000-0000-000000000001', 50, 10, 200, 30, 100, 3, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000001', 'i4000000-0000-0000-0000-000000000001', 'l2000000-0000-0000-0000-000000000001', 200, 50, 500, 150, 300, 2, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000001', 'i8000000-0000-0000-0000-000000000001', 'l2000000-0000-0000-0000-000000000001', 15, 5, 100, 20, 50, 2, CURRENT_TIMESTAMP),
  
  -- OR Stock
  ('f1000000-0000-0000-0000-000000000001', 'i6000000-0000-0000-0000-000000000001', 'l5000000-0000-0000-0000-000000000001', 500, 100, 1000, 300, 500, 3, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000001', 'i9000000-0000-0000-0000-000000000001', 'l5000000-0000-0000-0000-000000000001', 100, 20, 300, 75, 150, 2, CURRENT_TIMESTAMP),
  
  -- Pharmacy Stock
  ('f1000000-0000-0000-0000-000000000001', 'i2000000-0000-0000-0000-000000000001', 'l7000000-0000-0000-0000-000000000001', 120, 20, 400, 75, 200, 2, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000001', 'i3000000-0000-0000-0000-000000000001', 'l7000000-0000-0000-0000-000000000001', 25, 5, 50, 10, 20, 5, CURRENT_TIMESTAMP),
  
  -- ICU Stock
  ('f1000000-0000-0000-0000-000000000001', 'i7000000-0000-0000-0000-000000000001', 'l8000000-0000-0000-0000-000000000001', 300, 50, 800, 200, 400, 3, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000001', 'i10000000-0000-0000-0000-0000000001', 'l8000000-0000-0000-0000-000000000001', 5, 2, 10, 4, 8, 5, CURRENT_TIMESTAMP);

-- ============================================================================
-- Stock Lots (Expiration Tracking)
-- ============================================================================

INSERT INTO stock_lots (facility_id, inventory_item_id, location_id, lot_number, batch_number, manufacture_date, expiration_date, quantity_received, quantity_available, received_date, supplier_id, cost)
VALUES
  -- Aspirin lots
  ('f1000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000001', 'l2000000-0000-0000-0000-000000000001', 'LOT-ASP-2024-001', 'B24001', '2024-01-15', '2026-01-15', 100, 50, CURRENT_TIMESTAMP - INTERVAL '90 days', 's1000000-0000-0000-0000-000000000001', 5.50),
  ('f1000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000001', 'l2000000-0000-0000-0000-000000000001', 'LOT-ASP-2024-002', 'B24002', '2024-04-20', '2026-04-20', 200, 200, CURRENT_TIMESTAMP - INTERVAL '30 days', 's1000000-0000-0000-0000-000000000001', 5.50),
  
  -- Amoxicillin lots
  ('f1000000-0000-0000-0000-000000000001', 'i2000000-0000-0000-0000-000000000001', 'l7000000-0000-0000-0000-000000000001', 'LOT-AMX-2024-001', 'B24101', '2024-02-01', '2025-02-01', 200, 120, CURRENT_TIMESTAMP - INTERVAL '60 days', 's2000000-0000-0000-0000-000000000001', 12.00),
  
  -- Insulin lots
  ('f1000000-0000-0000-0000-000000000001', 'i3000000-0000-0000-0000-000000000001', 'l7000000-0000-0000-0000-000000000001', 'LOT-INS-2024-001', 'B24201', '2024-03-10', '2025-03-10', 50, 25, CURRENT_TIMESTAMP - INTERVAL '45 days', 's2000000-0000-0000-0000-000000000001', 35.00);

-- ============================================================================
-- Purchase Orders
-- ============================================================================

INSERT INTO purchase_orders (id, facility_id, supplier_id, po_number, po_date, expected_delivery_date, status, total_amount, currency)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 'PO-2024-001', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_DATE + INTERVAL '3 days', 'submitted', 1250.00, 'USD'),
  ('p2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 's2000000-0000-0000-0000-000000000001', 'PO-2024-002', CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_DATE + INTERVAL '2 days', 'confirmed', 2840.00, 'USD'),
  ('p3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 's3000000-0000-0000-0000-000000000001', 'PO-2024-003', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_DATE + INTERVAL '5 days', 'shipped', 425.00, 'USD');

-- ============================================================================
-- Purchase Order Items
-- ============================================================================

INSERT INTO purchase_order_items (purchase_order_id, inventory_item_id, quantity_ordered, quantity_received, unit_price, line_total, uom)
VALUES
  -- PO-2024-001 items
  ('p1000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000001', 100, 0, 5.50, 550.00, 'box'),
  ('p1000000-0000-0000-0000-000000000001', 'i4000000-0000-0000-0000-000000000001', 100, 0, 7.00, 700.00, 'box'),
  
  -- PO-2024-002 items
  ('p2000000-0000-0000-0000-000000000001', 'i2000000-0000-0000-0000-000000000001', 150, 0, 11.50, 1725.00, 'box'),
  ('p2000000-0000-0000-0000-000000000001', 'i8000000-0000-0000-0000-000000000001', 50, 0, 16.80, 840.00, 'box'),
  
  -- PO-2024-003 items
  ('p3000000-0000-0000-0000-000000000001', 'i10000000-0000-0000-0000-0000000001', 5, 0, 85.00, 425.00, 'unit');

-- ============================================================================
-- Reorder Rules
-- ============================================================================

INSERT INTO reorder_rules (facility_id, inventory_item_id, supplier_id, min_quantity, max_quantity, reorder_quantity, lead_time_days, is_active, auto_order)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 10, 200, 100, 3, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'i4000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 50, 500, 300, 2, TRUE, TRUE),
  ('f1000000-0000-0000-0000-000000000001', 'i2000000-0000-0000-0000-000000000001', 's2000000-0000-0000-0000-000000000001', 20, 400, 200, 2, TRUE, TRUE),
  ('f1000000-0000-0000-0000-000000000001', 'i8000000-0000-0000-0000-000000000001', 's2000000-0000-0000-0000-000000000001', 5, 100, 50, 2, TRUE, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 'i10000000-0000-0000-0000-0000000001', 's3000000-0000-0000-0000-000000000001', 2, 10, 5, 5, TRUE, FALSE);
