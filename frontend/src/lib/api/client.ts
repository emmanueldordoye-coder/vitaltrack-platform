import { env } from "@/lib/env";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  CreateFacilityInput,
  CreateInventoryItemInput,
  CreatePurchaseOrderInput,
  Facility,
  InventoryCatalogItem,
  LegacyInventoryItem,
  ListFacilitiesQuery,
  ListInventoryQuery,
  ListPurchaseOrdersQuery,
  PurchaseOrder,
  PurchaseOrderDetail,
} from "@/types/contracts";

type Primitive = string | number | boolean;

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor({
    message,
    code,
    status,
    details,
  }: {
    message: string;
    code: string;
    status: number;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const toSearchParams = (query?: Record<string, Primitive | undefined>) => {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export class VitalTrackApiClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl: string = env.apiBaseUrl,
  ) {}

  private async request<T>({
    path,
    method = "GET",
    query,
    body,
  }: {
    path: string;
    method?: "GET" | "POST";
    query?: Record<string, Primitive | undefined>;
    body?: unknown;
  }) {
    const response = await fetch(
      `${this.baseUrl}${path}${toSearchParams(query)}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as
      ApiSuccessResponse<T> | ApiErrorResponse;
    if (!response.ok || !payload.success) {
      const errorPayload = payload as ApiErrorResponse;
      throw new ApiClientError({
        message: errorPayload.error?.message ?? "Request failed.",
        code: errorPayload.error?.code ?? "UNKNOWN_API_ERROR",
        details: errorPayload.error?.details,
        status: response.status,
      });
    }

    return payload.data;
  }

  listFacilities(query: ListFacilitiesQuery = {}) {
    return this.request<Facility[]>({
      path: "/facilities",
      query: {
        city: query.city,
        facilityType: query.facilityType,
        isActive: query.isActive,
        limit: query.limit ?? 25,
      },
    });
  }

  createFacility(input: CreateFacilityInput) {
    return this.request<Facility>({
      path: "/facilities",
      method: "POST",
      body: input,
    });
  }

  listInventoryItems(query: ListInventoryQuery = {}) {
    return this.request<InventoryCatalogItem[]>({
      path: "/inventory",
      query: {
        category: query.category,
        isActive: query.isActive,
        search: query.search,
        limit: query.limit ?? 25,
      },
    });
  }

  createInventoryItem(input: CreateInventoryItemInput) {
    return this.request<LegacyInventoryItem>({
      path: "/inventory",
      method: "POST",
      body: input,
    });
  }

  listPurchaseOrders(query: ListPurchaseOrdersQuery = {}) {
    return this.request<PurchaseOrder[]>({
      path: "/purchase-orders",
      query: {
        facilityId: query.facilityId,
        status: query.status,
        supplierId: query.supplierId,
        limit: query.limit ?? 25,
      },
    });
  }

  getPurchaseOrder(id: string) {
    return this.request<PurchaseOrderDetail>({
      path: `/purchase-orders/${id}`,
    });
  }

  createPurchaseOrder(input: CreatePurchaseOrderInput) {
    return this.request<PurchaseOrder>({
      path: "/purchase-orders",
      method: "POST",
      body: input,
    });
  }
}
