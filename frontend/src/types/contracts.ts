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

export interface InventoryItem {
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
  inventory_item_id: string;
  quantity_ordered: number | null;
  quantity_received: number | null;
  unit_price: number | null;
  line_total: number | null;
  uom: string | null;
  notes: string | null;
}

export interface PurchaseOrder {
  id: string;
  facility_id: string;
  supplier_id: string | null;
  po_number: string;
  po_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  notes: string | null;
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
  status?: "draft" | "submitted" | "confirmed" | "shipped" | "received" | "cancelled";
  totalAmount?: number;
  currency?: string;
  notes?: string;
}

export interface SessionUser {
  user: User;
  accessToken: string;
}

// ─── Catalog / Stock ──────────────────────────────────────────────────────────

export interface StockLevel {
  inventory_item_id: string;
  available_quantity: number | null;
  reorder_level: number | null;
  min_level: number | null;
  max_level: number | null;
  reorder_quantity: number | null;
}

/** InventoryItem enriched with stock-level data and a computed status badge. */
export interface CatalogItem extends InventoryItem {
  supplier: { id: string; name: string } | null;
  stock_level: StockLevel | null;
  stock_status: "ok" | "low" | "critical" | "unknown";
}

export interface ListCatalogQuery {
  facilityId?: string;
  search?: string;
  category?: string;
  isActive?: boolean;
  limit?: number;
}

// ─── Suggested Orders ─────────────────────────────────────────────────────────

export type SuggestedOrderStatus =
  | "pending_review"
  | "approved"
  | "submitted"
  | "rejected";

export interface SuggestedOrder {
  id: string;
  organization_id: string;
  facility_id: string;
  supplier_id: string | null;
  supplier: { id: string; name: string } | null;
  status: SuggestedOrderStatus;
  total_estimated_cost: number | null;
  generated_at: string;
  approved_at: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  purchase_order_id: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SuggestedOrderItem {
  id: string;
  suggested_order_id: string;
  inventory_item_id: string;
  inventory_item: Pick<
    InventoryItem,
    "id" | "sku" | "name" | "category" | "uom" | "unit_cost"
  > | null;
  quantity_suggested: number;
  quantity_approved: number | null;
  unit_price: number | null;
  line_total: number | null;
  uom: string | null;
  notes: string | null;
}

export interface SuggestedOrderSupplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export type SuggestedOrderDetail = SuggestedOrder & {
  supplier: SuggestedOrderSupplier | null;
  items: SuggestedOrderItem[];
};

export interface ListSuggestedOrdersQuery {
  facilityId?: string;
  status?: SuggestedOrderStatus;
  limit?: number;
}

export interface GenerateSuggestedOrderInput {
  facilityId: string;
  notes?: string;
}

/** Returned by POST /suggested-orders/:id/approve */
export interface OrderConfirmation {
  suggestedOrderId: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierRef: string;
  status: "submitted";
  totalAmount: number;
  currency: string;
  itemCount: number;
  supplierId: string | null;
  submittedAt: string;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate: string | null;
}
