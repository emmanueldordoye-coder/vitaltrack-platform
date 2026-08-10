-- Validation: Dentira PO PTU317717 purchasing-data seed
-- Purpose: Prove the seed loaded source-backed purchasing/catalog data without
-- creating inventory_levels from purchase-order quantities.

DO $$
DECLARE
  catalog_rows INTEGER;
  inventory_rows INTEGER;
  po_rows INTEGER;
  po_lines INTEGER;
  ordered_units NUMERIC;
  order_total NUMERIC;
BEGIN
  SELECT COUNT(*)
  INTO catalog_rows
  FROM products
  WHERE organization_id = 'd0000000-0000-0000-0000-000000000001'
    AND metadata->>'source' = 'dentira_po_ptu317717';

  SELECT COUNT(*)
  INTO inventory_rows
  FROM inventory_levels il
  JOIN products p
    ON p.id = il.product_id
   AND p.organization_id = il.organization_id
  WHERE il.organization_id = 'd0000000-0000-0000-0000-000000000001'
    AND p.metadata->>'source' = 'dentira_po_ptu317717'
    AND il.deleted_at IS NULL;

  SELECT COUNT(*)
  INTO po_rows
  FROM purchase_orders
  WHERE organization_id = 'd0000000-0000-0000-0000-000000000001'
    AND po_number = 'PTU317717'
    AND metadata->>'dentira_order_number' = '6209555669'
    AND total_amount = 1384.47
    AND deleted_at IS NULL;

  SELECT COUNT(*), COALESCE(SUM(quantity_ordered), 0), COALESCE(SUM(line_total), 0)
  INTO po_lines, ordered_units, order_total
  FROM purchase_order_items poi
  JOIN purchase_orders po
    ON po.id = poi.purchase_order_id
  WHERE po.organization_id = 'd0000000-0000-0000-0000-000000000001'
    AND po.po_number = 'PTU317717'
    AND poi.metadata->>'source' = 'dentira_po_ptu317717'
    AND poi.deleted_at IS NULL;

  IF catalog_rows <> 42 THEN
    RAISE EXCEPTION 'Expected 42 PO-backed catalog rows, found %', catalog_rows;
  END IF;

  IF inventory_rows <> 0 THEN
    RAISE EXCEPTION 'Expected 0 PO-backed inventory rows, found %', inventory_rows;
  END IF;

  IF po_rows <> 1 THEN
    RAISE EXCEPTION 'Expected 1 Dentira PO PTU317717 row, found %', po_rows;
  END IF;

  IF po_lines <> 42 OR ordered_units <> 63 OR order_total <> 1384.47 THEN
    RAISE EXCEPTION 'Dentira PO line reconciliation failed: lines %, units %, total %',
      po_lines, ordered_units, order_total;
  END IF;
END $$;
