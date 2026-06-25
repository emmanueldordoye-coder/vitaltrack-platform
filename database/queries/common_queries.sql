-- VitalTrack Platform - Common Queries
-- Frequently used queries for reporting, analytics, and operations

-- ============================================================================
-- INVENTORY ANALYTICS
-- ============================================================================

-- Low stock alert: Items below minimum threshold
-- Returns items that need reordering
SELECT
  sl.id,
  ii.sku,
  ii.name,
  f.name as facility_name,
  sl.available_quantity,
  sl.min_level,
  sl.reorder_quantity,
  sl.lead_time_days,
  (sl.min_level - sl.available_quantity) as shortage_units,
  ROUND((sl.available_quantity::numeric / NULLIF(sl.min_level, 0)) * 100, 2) as stock_coverage_pct
FROM stock_levels sl
JOIN inventory_items ii ON sl.inventory_item_id = ii.id
JOIN facilities f ON sl.facility_id = f.id
WHERE sl.available_quantity <= sl.min_level
  AND f.organization_id = $1  -- parameterized organization_id
ORDER BY stock_coverage_pct ASC, ii.name;

-- Expiring soon: Lots expiring within N days
-- Critical for pharmaceutical/perishable inventory management
SELECT
  sl.id,
  ii.sku,
  ii.name,
  f.name as facility_name,
  l.location_code,
  sl.lot_number,
  sl.batch_number,
  sl.expiration_date,
  (sl.expiration_date - CURRENT_DATE) as days_until_expiration,
  sl.quantity_available,
  (sl.expiration_date - CURRENT_DATE)::int as urgency_score
FROM stock_lots sl
JOIN inventory_items ii ON sl.inventory_item_id = ii.id
JOIN facilities f ON sl.facility_id = f.id
LEFT JOIN locations l ON sl.location_id = l.id
WHERE ii.track_expiration = TRUE
  AND sl.expiration_date IS NOT NULL
  AND sl.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
  AND sl.quantity_available > 0
  AND f.organization_id = $1
ORDER BY urgency_score ASC;

-- Stock value report: Total inventory value by category
-- For financial reporting and valuation
SELECT
  ii.category,
  COUNT(*) as item_count,
  SUM(sl.available_quantity) as total_units,
  SUM(ii.unit_cost) as total_cost_per_unit,
  ROUND(SUM(sl.available_quantity * ii.unit_cost)::numeric, 2) as total_inventory_value
FROM stock_levels sl
JOIN inventory_items ii ON sl.inventory_item_id = ii.id
JOIN facilities f ON sl.facility_id = f.id
WHERE f.organization_id = $1
  AND sl.available_quantity > 0
GROUP BY ii.category
ORDER BY total_inventory_value DESC;

-- Usage rate analysis: How quickly items are being consumed
-- Calculate based on stock movements over last 30 days
SELECT
  ii.sku,
  ii.name,
  ii.category,
  f.name as facility_name,
  COUNT(sm.id) as movement_count_30d,
  SUM(CASE WHEN sm.movement_type = 'consume' THEN sm.quantity ELSE 0 END) as total_consumed_30d,
  AVG(CASE WHEN sm.movement_type = 'consume' THEN sm.quantity ELSE NULL END) as avg_consumption_per_movement,
  ROUND((SUM(CASE WHEN sm.movement_type = 'consume' THEN sm.quantity ELSE 0 END)::numeric / 30), 2) as daily_consumption_rate
FROM inventory_items ii
JOIN facilities f ON ii.organization_id = f.organization_id
LEFT JOIN stock_movements sm ON ii.id = sm.inventory_item_id
  AND sm.facility_id = f.id
  AND sm.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND sm.movement_type = 'consume'
WHERE ii.organization_id = $1
GROUP BY ii.id, ii.sku, ii.name, ii.category, f.id, f.name
HAVING SUM(CASE WHEN sm.movement_type = 'consume' THEN sm.quantity ELSE 0 END) > 0
ORDER BY total_consumed_30d DESC;

-- ============================================================================
-- PURCHASE ORDER ANALYTICS
-- ============================================================================

-- Purchase order status summary
SELECT
  status,
  COUNT(*) as po_count,
  ROUND(SUM(total_amount)::numeric, 2) as total_value,
  ROUND(AVG(total_amount)::numeric, 2) as avg_po_value,
  MAX(po_date) as most_recent_po_date
FROM purchase_orders
WHERE facility_id IN (
  SELECT id FROM facilities WHERE organization_id = $1
)
GROUP BY status
ORDER BY po_count DESC;

-- Outstanding purchase orders (pending delivery)
SELECT
  po.id,
  po.po_number,
  s.name as supplier_name,
  f.name as facility_name,
  po.total_amount,
  po.po_date,
  po.expected_delivery_date,
  (po.expected_delivery_date - CURRENT_DATE) as days_until_delivery,
  COUNT(DISTINCT poi.inventory_item_id) as item_count,
  SUM(poi.quantity_ordered) as total_units_ordered,
  po.status
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
JOIN facilities f ON po.facility_id = f.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE f.organization_id = $1
  AND po.status NOT IN ('received', 'cancelled')
GROUP BY po.id, po.po_number, s.name, f.name, po.total_amount, po.po_date, po.expected_delivery_date, po.status
ORDER BY po.expected_delivery_date ASC;

-- Supplier performance: On-time delivery and average order value
SELECT
  s.name as supplier_name,
  COUNT(DISTINCT po.id) as total_orders,
  SUM(po.total_amount) as total_spent,
  ROUND(AVG(po.total_amount)::numeric, 2) as avg_order_value,
  COUNT(DISTINCT CASE WHEN po.actual_delivery_date <= po.expected_delivery_date THEN po.id END) as on_time_deliveries,
  ROUND(
    (COUNT(DISTINCT CASE WHEN po.actual_delivery_date <= po.expected_delivery_date THEN po.id END)::numeric / 
     NULLIF(COUNT(DISTINCT CASE WHEN po.status = 'received' THEN po.id END), 0)) * 100,
    2
  ) as on_time_delivery_pct
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
  AND po.facility_id IN (SELECT id FROM facilities WHERE organization_id = $1)
WHERE s.organization_id = $1
GROUP BY s.id, s.name
ORDER BY on_time_delivery_pct DESC NULLS LAST;

-- ============================================================================
-- AUDIT & COMPLIANCE
-- ============================================================================

-- Stock discrepancy detection: Items with unusual movement patterns
SELECT
  ii.sku,
  ii.name,
  f.name as facility_name,
  COUNT(DISTINCT CASE WHEN sm.movement_type = 'waste' THEN sm.id END) as waste_count,
  SUM(CASE WHEN sm.movement_type = 'waste' THEN sm.quantity ELSE 0 END) as total_wasted,
  COUNT(DISTINCT CASE WHEN sm.movement_type = 'adjust' THEN sm.id END) as adjustment_count,
  COUNT(DISTINCT CASE WHEN sm.movement_type = 'adjust' AND sm.quantity < 0 THEN sm.id END) as negative_adjustments,
  ROUND((SUM(CASE WHEN sm.movement_type = 'waste' THEN sm.quantity ELSE 0 END)::numeric / 
         NULLIF(SUM(CASE WHEN sm.movement_type = 'consume' THEN sm.quantity ELSE 0 END), 0)) * 100, 2) as waste_to_consumption_ratio
FROM inventory_items ii
JOIN stock_movements sm ON ii.id = sm.inventory_item_id
  AND sm.created_at >= CURRENT_DATE - INTERVAL '90 days'
JOIN facilities f ON sm.facility_id = f.id
WHERE f.organization_id = $1
GROUP BY ii.id, ii.sku, ii.name, f.id, f.name
HAVING SUM(CASE WHEN sm.movement_type = 'waste' THEN sm.quantity ELSE 0 END) > 0
ORDER BY waste_to_consumption_ratio DESC NULLS LAST;

-- User audit trail: Who made changes and when
SELECT
  u.full_name,
  al.action,
  al.resource_type,
  al.changes_summary,
  al.status,
  al.created_at,
  COUNT(*) as action_count
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.organization_id = $1
  AND al.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.full_name, al.action, al.resource_type, al.changes_summary, al.status, al.created_at
ORDER BY al.created_at DESC
LIMIT 100;

-- ============================================================================
-- OPERATIONAL METRICS
-- ============================================================================

-- Facility inventory snapshot: Current stock status across all facilities
SELECT
  f.name as facility_name,
  COUNT(DISTINCT sl.id) as active_item_count,
  SUM(sl.available_quantity) as total_units_in_stock,
  COUNT(DISTINCT CASE WHEN sl.available_quantity <= sl.min_level THEN sl.id END) as low_stock_items,
  COUNT(DISTINCT CASE WHEN sl.available_quantity > sl.max_level THEN sl.id END) as overstock_items,
  ROUND(SUM(sl.available_quantity * ii.unit_cost)::numeric, 2) as estimated_inventory_value
FROM facilities f
LEFT JOIN stock_levels sl ON f.id = sl.facility_id
LEFT JOIN inventory_items ii ON sl.inventory_item_id = ii.id
WHERE f.organization_id = $1
GROUP BY f.id, f.name
ORDER BY estimated_inventory_value DESC;

-- Department inventory distribution
SELECT
  f.name as facility_name,
  d.name as department_name,
  COUNT(DISTINCT ii.id) as item_types,
  SUM(sl.available_quantity) as total_quantity,
  ROUND(SUM(sl.available_quantity * ii.unit_cost)::numeric, 2) as total_value
FROM departments d
JOIN facilities f ON d.facility_id = f.id
LEFT JOIN locations l ON d.id = l.department_id
LEFT JOIN stock_levels sl ON l.id = sl.location_id
LEFT JOIN inventory_items ii ON sl.inventory_item_id = ii.id
WHERE f.organization_id = $1
GROUP BY f.id, f.name, d.id, d.name
ORDER BY f.name, total_value DESC;

-- ============================================================================
-- ALERTS & NOTIFICATIONS
-- ============================================================================

-- Active unresolved alerts by severity
SELECT
  a.severity,
  a.alert_type,
  COUNT(*) as alert_count,
  COUNT(DISTINCT a.facility_id) as affected_facilities,
  COUNT(DISTINCT a.inventory_item_id) as affected_items,
  MAX(a.created_at) as most_recent_alert
FROM alerts a
WHERE a.organization_id = $1
  AND a.is_resolved = FALSE
GROUP BY a.severity, a.alert_type
ORDER BY 
  CASE a.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  alert_count DESC;

-- ============================================================================
-- REORDER RECOMMENDATIONS
-- ============================================================================

-- Auto-reorder recommendations: Items ready to order
-- Based on consumption rate and lead time
SELECT
  ii.sku,
  ii.name,
  f.name as facility_name,
  sl.available_quantity,
  rr.reorder_quantity,
  rr.min_quantity,
  s.name as supplier_name,
  rr.lead_time_days,
  ROUND((sl.available_quantity / NULLIF(rr.reorder_quantity, 0))::numeric, 2) as current_coverage_ratio,
  CASE 
    WHEN sl.available_quantity <= rr.min_quantity THEN 'URGENT'
    WHEN sl.available_quantity <= rr.min_quantity * 1.5 THEN 'HIGH_PRIORITY'
    ELSE 'STANDARD'
  END as priority
FROM reorder_rules rr
JOIN inventory_items ii ON rr.inventory_item_id = ii.id
JOIN facilities f ON rr.facility_id = f.id
JOIN stock_levels sl ON f.id = sl.facility_id AND ii.id = sl.inventory_item_id
LEFT JOIN suppliers s ON rr.supplier_id = s.id
WHERE f.organization_id = $1
  AND rr.is_active = TRUE
  AND sl.available_quantity <= rr.min_quantity * 2
ORDER BY priority, sl.available_quantity ASC;
