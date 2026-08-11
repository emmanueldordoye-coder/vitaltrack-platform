import type { Json, TableRow } from "../../types/database.js";

type PurchaseOrderItemRow = TableRow<"purchase_order_items">;

interface RelatedManufacturer {
  id: string;
  name: string;
}

interface RelatedProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  manufacturer_part_number: string | null;
  brand_name: string | null;
  metadata: Json | null;
  manufacturers?: RelatedManufacturer | RelatedManufacturer[] | null;
}

interface RelatedVendor {
  id: string;
  name: string;
  vendor_code: string | null;
}

interface RelatedPurchaseOrder {
  id: string;
  po_number: string;
  po_date: string;
  confirmation_number: string | null;
  currency: string | null;
  metadata: Json | null;
  vendors?: RelatedVendor | RelatedVendor[] | null;
}

export type ProductCatalogRecord = PurchaseOrderItemRow & {
  products?: RelatedProduct | RelatedProduct[] | null;
  purchase_orders?: RelatedPurchaseOrder | RelatedPurchaseOrder[] | null;
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

export const mapProductCatalogItem = (record: ProductCatalogRecord) => {
  const product = firstRelated(record.products);
  const manufacturer = firstRelated(product?.manufacturers);
  const order = firstRelated(record.purchase_orders);
  const vendor = firstRelated(order?.vendors);
  const itemMetadata = record.metadata;
  const productMetadata = product?.metadata;
  const orderMetadata = order?.metadata;
  const imageReference =
    metadataString(itemMetadata, "image_source") ??
    metadataString(productMetadata, "image_source");

  return {
    source_purchase_order_item_id: record.id,
    product_id: product?.id ?? record.product_id,
    sku: product?.sku ?? null,
    product_name:
      product?.name ?? metadataString(itemMetadata, "normalized_product_name"),
    product_description:
      product?.description ??
      metadataString(itemMetadata, "raw_product_description"),
    raw_description:
      record.notes ?? metadataString(itemMetadata, "raw_product_description"),
    manufacturer_part_number: product?.manufacturer_part_number ?? null,
    brand_or_manufacturer:
      product?.brand_name ??
      manufacturer?.name ??
      metadataString(itemMetadata, "brand_or_manufacturer") ??
      metadataString(productMetadata, "brand_or_manufacturer"),
    supplier_name:
      vendor?.name ??
      metadataString(orderMetadata, "supplier") ??
      metadataString(itemMetadata, "supplier"),
    vendor_id: vendor?.id ?? null,
    vendor_item_number:
      metadataString(itemMetadata, "vendor_item_number") ??
      metadataString(productMetadata, "vendor_item_number"),
    last_known_unit_price: coerceNumber(record.unit_price),
    currency: order?.currency ?? "USD",
    source_po_number: order?.po_number ?? null,
    source_order_number:
      metadataString(orderMetadata, "dentira_order_number") ??
      order?.confirmation_number ??
      null,
    source_order_date: order?.po_date ?? null,
    source_line_number: metadataNumber(itemMetadata, "source_line_number"),
    image_reference: imageReference,
    image_source_page:
      metadataString(itemMetadata, "image_source_page") ??
      metadataString(productMetadata, "image_source_page"),
    image_strategy: imageReference
      ? "source-screenshot-reference"
      : "neutral-placeholder",
  };
};

export type ProductCatalogItem = ReturnType<typeof mapProductCatalogItem>;
