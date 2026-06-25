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
