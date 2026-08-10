import type { Json, TableRow } from "../../types/database.js";

type PurchaseOrderRow = TableRow<"purchase_orders">;
type PurchaseOrderItemRow = TableRow<"purchase_order_items">;

interface RelatedSupplier {
  id: string;
  name: string;
  supplier_code: string | null;
}

interface RelatedVendor {
  id: string;
  name: string;
  vendor_code: string | null;
}

interface RelatedManufacturer {
  id: string;
  name: string;
}

interface RelatedProduct {
  id: string;
  sku: string;
  name: string;
  brand_name: string | null;
  metadata: Json | null;
  manufacturers?: RelatedManufacturer | RelatedManufacturer[] | null;
}

export type PurchaseOrderItemRecord = PurchaseOrderItemRow & {
  products?: RelatedProduct | RelatedProduct[] | null;
};

export type PurchaseOrderRecord = PurchaseOrderRow & {
  suppliers?: RelatedSupplier | RelatedSupplier[] | null;
  vendors?: RelatedVendor | RelatedVendor[] | null;
  purchase_order_items?: PurchaseOrderItemRecord[] | null;
};

const firstRelated = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;

const coerceNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const metadataRecord = (metadata: Json | null | undefined) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, Json | undefined>;
};

const metadataString = (metadata: Json | null | undefined, key: string) => {
  const value = metadataRecord(metadata)[key];
  return typeof value === "string" && value.trim() ? value : null;
};

const metadataNumber = (metadata: Json | null | undefined, key: string) => {
  const value = metadataRecord(metadata)[key];
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const mapPurchaseOrderItem = (item: PurchaseOrderItemRecord) => {
  const product = firstRelated(item.products);
  const manufacturer = firstRelated(product?.manufacturers);
  const metadata = item.metadata;
  const productMetadata = product?.metadata;

  return {
    id: item.id,
    purchase_order_id: item.purchase_order_id,
    inventory_item_id: item.inventory_item_id,
    organization_id: item.organization_id,
    product_id: item.product_id,
    product_name:
      product?.name ?? metadataString(metadata, "normalized_product_name"),
    product_sku: product?.sku ?? null,
    raw_description:
      item.notes ?? metadataString(metadata, "raw_product_description"),
    brand_or_manufacturer:
      product?.brand_name ??
      manufacturer?.name ??
      metadataString(metadata, "brand_or_manufacturer") ??
      metadataString(productMetadata, "brand_or_manufacturer"),
    vendor_item_number:
      metadataString(metadata, "vendor_item_number") ??
      metadataString(productMetadata, "vendor_item_number"),
    source_line_number: metadataNumber(metadata, "source_line_number"),
    image_reference:
      metadataString(metadata, "image_source") ??
      metadataString(productMetadata, "image_source"),
    image_source_page:
      metadataString(metadata, "image_source_page") ??
      metadataString(productMetadata, "image_source_page"),
    quantity_ordered: coerceNumber(item.quantity_ordered),
    quantity_received: coerceNumber(item.quantity_received),
    unit_price: coerceNumber(item.unit_price),
    line_total: coerceNumber(item.line_total),
    uom: item.uom,
    notes: item.notes,
  };
};

export const mapPurchaseOrder = (order: PurchaseOrderRecord) => {
  const supplier = firstRelated(order.suppliers);
  const vendor = firstRelated(order.vendors);
  const items = (order.purchase_order_items ?? []).map(mapPurchaseOrderItem);
  const orderedUnitCount = items.reduce(
    (total, item) => total + (item.quantity_ordered ?? 0),
    0,
  );
  const metadata = order.metadata;

  return {
    id: order.id,
    organization_id: order.organization_id,
    facility_id: order.facility_id,
    supplier_id: order.supplier_id,
    supplier_name:
      supplier?.name ??
      vendor?.name ??
      metadataString(metadata, "supplier") ??
      null,
    vendor_id: order.vendor_id,
    vendor_name: vendor?.name ?? null,
    po_number: order.po_number,
    order_number:
      metadataString(metadata, "dentira_order_number") ??
      order.confirmation_number,
    po_date: order.po_date,
    expected_delivery_date: order.expected_delivery_date,
    actual_delivery_date: order.actual_delivery_date,
    status: order.status,
    total_amount: coerceNumber(order.total_amount),
    currency: order.currency,
    notes: order.notes,
    line_item_count: items.length,
    ordered_unit_count: orderedUnitCount,
    source_total_items: metadataNumber(metadata, "stated_total_items"),
    source_status_label: metadataString(metadata, "status_source"),
    created_by: order.created_by,
    updated_by: order.updated_by,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items,
  };
};
