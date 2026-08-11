import type { User } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
  meta: ApiResponseMeta;
}

export interface Facility {
  id: string;
  organization_id: string;
  name: string;
  facility_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  is_active: boolean | null;
  metadata: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InventoryCatalogItem {
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

export interface ProductCatalogItem {
  product_id: string;
  sku: string | null;
  product_name: string | null;
  product_description: string | null;
  raw_description: string | null;
  manufacturer_part_number: string | null;
  brand_or_manufacturer: string | null;
  supplier_name: string | null;
  vendor_item_number: string | null;
  last_known_unit_price: number | null;
  currency: string | null;
  source_po_number: string | null;
  source_order_number: string | null;
  source_order_date: string | null;
  source_line_number: number | null;
  image_reference: string | null;
  image_source_page: string | null;
  image_strategy: "source-screenshot-reference" | "neutral-placeholder";
}

export interface LegacyInventoryItem {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  uom: string | null;
  unit_cost: number | null;
  currency: string | null;
  supplier_id: string | null;
  manufacturer: string | null;
  model_number: string | null;
  track_expiration: boolean | null;
  expiration_alert_days: number | null;
  is_active: boolean | null;
  image_url: string | null;
  notes: string | null;
  metadata: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string | null;
  organization_id?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  product_sku?: string | null;
  raw_description?: string | null;
  brand_or_manufacturer?: string | null;
  vendor_item_number?: string | null;
  source_line_number?: number | null;
  image_reference?: string | null;
  image_source_page?: string | null;
  quantity_ordered: number | null;
  quantity_received: number | null;
  unit_price: number | null;
  line_total: number | null;
  uom: string | null;
  notes: string | null;
}

export interface PurchaseOrder {
  id: string;
  organization_id?: string | null;
  facility_id: string;
  supplier_id: string | null;
  supplier_name?: string | null;
  vendor_id?: string | null;
  vendor_name?: string | null;
  po_number: string;
  order_number?: string | null;
  po_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  notes: string | null;
  line_item_count?: number;
  ordered_unit_count?: number;
  source_total_items?: number | null;
  source_status_label?: string | null;
  items?: PurchaseOrderItem[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type PurchaseOrderDetail = PurchaseOrder & {
  items: PurchaseOrderItem[];
};

export interface ListFacilitiesQuery {
  city?: string;
  facilityType?: string;
  isActive?: boolean;
  limit?: number;
}

export interface CreateFacilityInput {
  name: string;
  facilityType?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  isActive?: boolean;
  metadata?: Record<string, Json>;
}

export interface ListInventoryQuery {
  category?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
}

export interface ListProductCatalogQuery {
  search?: string;
  limit?: number;
}

export interface CreateInventoryItemInput {
  sku: string;
  name: string;
  category?: string;
  subcategory?: string;
  description?: string;
  uom?: string;
  unitCost?: number;
  currency?: string;
  supplierId?: string;
  manufacturer?: string;
  modelNumber?: string;
  trackExpiration?: boolean;
  expirationAlertDays?: number;
  isActive?: boolean;
  imageUrl?: string;
  notes?: string;
  metadata?: Record<string, Json>;
}

export interface ListPurchaseOrdersQuery {
  facilityId?: string;
  status?: string;
  supplierId?: string;
  limit?: number;
}

export interface CreatePurchaseOrderInput {
  facilityId: string;
  supplierId?: string;
  poNumber: string;
  poDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status?:
    "draft" | "submitted" | "confirmed" | "shipped" | "received" | "cancelled";
  totalAmount?: number;
  currency?: string;
  notes?: string;
}

export interface SessionUser {
  user: User;
  accessToken: string;
}
