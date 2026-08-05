import type { Json } from "../../types/database.js";

export interface LighthouseInventoryProduct {
  id: string;
  sku: string;
  name: string;
  manufacturer_part_number: string | null;
  metadata: Json | null;
}

export interface LighthouseInventoryLocation {
  id: string;
  name: string;
}

export interface LighthouseInventoryLevelRecord {
  product_id: string;
  current_quantity: number | string;
  par_level: number | string;
  reorder_point: number | string;
  location_id: string;
  products: LighthouseInventoryProduct | LighthouseInventoryProduct[] | null;
  locations: LighthouseInventoryLocation | LighthouseInventoryLocation[] | null;
}

export interface LighthouseVendorRecord {
  id: string;
  name: string;
  vendor_code: string | null;
}

export interface LighthouseInventoryItemResponse {
  product_id: string;
  sku: string;
  product_name: string;
  manufacturer_part_number: string | null;
  current_quantity: number;
  par_level: number;
  reorder_point: number;
  location_id: string;
  location_name: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  unit_cost: number | null;
  is_low_stock: boolean;
}

const firstRelated = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;

const coerceNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
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

export const mapLighthouseInventoryItems = (
  records: LighthouseInventoryLevelRecord[],
  vendors: LighthouseVendorRecord[],
): LighthouseInventoryItemResponse[] => {
  const vendorsByCode = new Map(
    vendors
      .filter((vendor) => vendor.vendor_code)
      .map((vendor) => [vendor.vendor_code as string, vendor]),
  );

  return records.map((record) => {
    const product = firstRelated(record.products);
    const location = firstRelated(record.locations);
    const vendorCode = metadataString(product?.metadata, "primary_vendor_code");
    const vendor = vendorCode ? vendorsByCode.get(vendorCode) : undefined;
    const currentQuantity = coerceNumber(record.current_quantity);
    const reorderPoint = coerceNumber(record.reorder_point);

    return {
      product_id: product?.id ?? record.product_id,
      sku: product?.sku ?? "",
      product_name: product?.name ?? "",
      manufacturer_part_number: product?.manufacturer_part_number ?? null,
      current_quantity: currentQuantity,
      par_level: coerceNumber(record.par_level),
      reorder_point: reorderPoint,
      location_id: location?.id ?? record.location_id,
      location_name: location?.name ?? null,
      vendor_id: vendor?.id ?? null,
      vendor_name:
        vendor?.name ??
        metadataString(product?.metadata, "vendor_name") ??
        vendorCode,
      unit_cost: metadataNumber(product?.metadata, "unit_cost"),
      is_low_stock: currentQuantity <= reorderPoint,
    };
  });
};
