import assert from "node:assert/strict";
import test from "node:test";

import type { RequestHandler } from "express";
import supertest from "supertest";

import type { Database, TableInsert } from "../src/types/database.js";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.GIT_SHA = "workflow-sha";
process.env.RENDER_GIT_COMMIT = "render-sha";

const { createApp } = await import("../src/app.js");

type QueryState = {
  table: keyof Database["public"]["Tables"];
  operation: "select" | "insert";
  payload?: unknown;
  filters: Array<{ type: string; column?: string; value?: unknown }>;
  limit?: number;
  singleMode?: "single" | "maybeSingle";
};

type QueryResult = {
  data: unknown;
  error: null | { code?: string; message: string };
};

type QueryHandler = (state: QueryState) => QueryResult | Promise<QueryResult>;

class FakeQueryBuilder implements PromiseLike<QueryResult> {
  private readonly state: QueryState;

  private readonly handler: QueryHandler;

  public constructor(
    table: keyof Database["public"]["Tables"],
    handler: QueryHandler,
  ) {
    this.state = {
      table,
      operation: "select",
      filters: [],
    };
    this.handler = handler;
  }

  public select() {
    return this;
  }

  public order(column: string) {
    this.state.filters.push({ type: "order", column });
    return this;
  }

  public limit(value: number) {
    this.state.limit = value;
    return this;
  }

  public eq(column: string, value: unknown) {
    this.state.filters.push({ type: "eq", column, value });
    return this;
  }

  public is(column: string, value: unknown) {
    this.state.filters.push({ type: "is", column, value });
    return this;
  }

  public ilike(column: string, value: unknown) {
    this.state.filters.push({ type: "ilike", column, value });
    return this;
  }

  public or(value: string) {
    this.state.filters.push({ type: "or", value });
    return this;
  }

  public insert(payload: unknown) {
    this.state.operation = "insert";
    this.state.payload = payload;
    return this;
  }

  public single() {
    this.state.singleMode = "single";
    return this;
  }

  public maybeSingle() {
    this.state.singleMode = "maybeSingle";
    return this;
  }

  public then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.handler(structuredClone(this.state))).then(
      onfulfilled ?? undefined,
      onrejected ?? undefined,
    );
  }
}

const createFakeSupabase = (
  handlers: Partial<Record<keyof Database["public"]["Tables"], QueryHandler>>,
) => ({
  from(table: keyof Database["public"]["Tables"]) {
    const handler = handlers[table];

    if (!handler) {
      throw new Error(
        `No fake Supabase handler registered for table "${table}".`,
      );
    }

    return new FakeQueryBuilder(table, handler);
  },
});

const createRequestContextMiddleware = (options: {
  accessToken?: string;
  organizationId?: string;
  userId?: string;
  supabase?: ReturnType<typeof createFakeSupabase>;
}): RequestHandler => {
  const accessToken =
    "accessToken" in options ? options.accessToken : "token-123";
  const organizationId =
    "organizationId" in options ? options.organizationId : "org-123";
  const userId = "userId" in options ? options.userId : "user-123";
  const supabase = options.supabase ?? createFakeSupabase({});

  return (req, _res, next) => {
    req.context = {
      requestId: "req-test",
      accessToken,
      organizationId,
      supabase: supabase as never,
      user: userId
        ? ({
            id: userId,
          } as never)
        : undefined,
      validated: {},
    };

    next();
  };
};

test("GET /api/v1/health reports the Render commit when available", async () => {
  const app = createApp();

  const response = await supertest(app).get("/api/v1/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.data.gitSha, "render-sha");
  assert.equal(response.body.data.gitShaSource, "RENDER_GIT_COMMIT");
  assert.equal(response.body.data.supabaseProjectRef, "example");
});

test("POST /api/v1/facilities uses the authenticated organization context", async () => {
  let insertedPayload: TableInsert<"facilities"> | undefined;

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      supabase: createFakeSupabase({
        facilities: (state) => {
          if (state.operation === "insert") {
            insertedPayload = state.payload as TableInsert<"facilities">;

            return {
              data: {
                id: "facility-1",
                ...insertedPayload,
              },
              error: null,
            };
          }

          return { data: [], error: null };
        },
      }),
    }),
  });

  const response = await supertest(app).post("/api/v1/facilities").send({
    organizationId: "org-foreign",
    name: "Central Hospital",
    facilityType: "hospital",
    city: "Lagos",
  });

  assert.equal(response.status, 201);
  assert.equal(insertedPayload?.organization_id, "org-current");
  assert.equal(response.body.data.organization_id, "org-current");
});

test("GET /api/v1/facilities rejects unauthorized access", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      accessToken: undefined,
      organizationId: undefined,
      userId: undefined,
      supabase: createFakeSupabase({
        facilities: () => ({ data: [], error: null }),
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/facilities");

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "AUTH_HEADER_MISSING");
});

test("GET /api/v1/facilities rejects authenticated users without an organization context", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: undefined,
      supabase: createFakeSupabase({
        facilities: () => ({ data: [], error: null }),
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/facilities");

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, "AUTH_ORGANIZATION_REQUIRED");
});

test("GET /api/v1/facilities/:id returns 404 when RLS hides another tenant's row", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      supabase: createFakeSupabase({
        facilities: () => ({ data: null, error: null }),
      }),
    }),
  });

  const response = await supertest(app).get(
    "/api/v1/facilities/f91020dc-986f-4027-b3ea-b9e4391129fd",
  );

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
});

test("POST /api/v1/inventory uses the authenticated organization context", async () => {
  let insertedPayload: TableInsert<"inventory_items"> | undefined;

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      supabase: createFakeSupabase({
        inventory_items: (state) => {
          if (state.operation === "insert") {
            insertedPayload = state.payload as TableInsert<"inventory_items">;

            return {
              data: {
                id: "inventory-1",
                ...insertedPayload,
              },
              error: null,
            };
          }

          return { data: [], error: null };
        },
      }),
    }),
  });

  const response = await supertest(app).post("/api/v1/inventory").send({
    organizationId: "org-foreign",
    sku: "SKU-123",
    name: "Syringe Pack",
    category: "consumables",
    trackExpiration: true,
  });

  assert.equal(response.status, 201);
  assert.equal(insertedPayload?.organization_id, "org-current");
  assert.equal(response.body.data.organization_id, "org-current");
});

test("GET /api/v1/inventory rejects unauthorized access", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      accessToken: undefined,
      organizationId: undefined,
      userId: undefined,
      supabase: createFakeSupabase({
        inventory_items: () => ({ data: [], error: null }),
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/inventory");

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "AUTH_HEADER_MISSING");
});

test("GET /api/v1/inventory/:id returns 404 when RLS hides another tenant's row", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      supabase: createFakeSupabase({
        inventory_items: () => ({ data: null, error: null }),
      }),
    }),
  });

  const response = await supertest(app).get(
    "/api/v1/inventory/458a690b-dc0d-4374-a177-f3f467f34994",
  );

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
});

test("POST /api/v1/purchase-orders derives audit fields from the authenticated user", async () => {
  let insertedPayload: TableInsert<"purchase_orders"> | undefined;

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      userId: "user-current",
      supabase: createFakeSupabase({
        purchase_orders: (state) => {
          if (state.operation === "insert") {
            insertedPayload = state.payload as TableInsert<"purchase_orders">;

            return {
              data: {
                id: "po-1",
                ...insertedPayload,
              },
              error: null,
            };
          }

          return { data: [], error: null };
        },
      }),
    }),
  });

  const response = await supertest(app).post("/api/v1/purchase-orders").send({
    facilityId: "b3b9875f-2449-40d6-b825-0866712bce90",
    poNumber: "PO-1001",
    poDate: "2026-06-25T12:00:00Z",
    createdBy: "user-foreign",
    updatedBy: "user-foreign",
  });

  assert.equal(response.status, 201);
  assert.equal(insertedPayload?.created_by, "user-current");
  assert.equal(insertedPayload?.updated_by, "user-current");
  assert.equal(response.body.data.created_by, "user-current");
});

test("GET /api/v1/purchase-orders rejects unauthorized access", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      accessToken: undefined,
      organizationId: undefined,
      userId: undefined,
      supabase: createFakeSupabase({
        purchase_orders: () => ({ data: [], error: null }),
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/purchase-orders");

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "AUTH_HEADER_MISSING");
});

test("GET /api/v1/purchase-orders maps Dentira PO source-backed fields", async () => {
  let observedFilters: QueryState["filters"] = [];

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-dentira",
      supabase: createFakeSupabase({
        purchase_orders: (state) => {
          observedFilters = state.filters;

          return {
            data: [
              {
                id: "po-dentira",
                organization_id: "org-dentira",
                facility_id: "facility-dentira",
                supplier_id: "supplier-patterson",
                vendor_id: "vendor-patterson",
                suggested_order_id: null,
                po_number: "PTU317717",
                po_date: "2026-06-12T00:00:00",
                expected_delivery_date: null,
                actual_delivery_date: null,
                status: null,
                total_amount: 1384.47,
                estimated_savings: 0,
                currency: "USD",
                confirmation_number: null,
                mock_supplier_submission: false,
                notes: null,
                metadata: {
                  dentira_order_number: "6209555669",
                  stated_total_items: 42,
                  calculated_ordered_units: 63,
                  status_source: "not_available",
                },
                deleted_at: null,
                created_by: null,
                updated_by: null,
                created_at: "2026-06-12T00:00:00",
                updated_at: "2026-06-12T00:00:00",
                suppliers: {
                  id: "supplier-patterson",
                  name: "Patterson Dental Supply Inc",
                  supplier_code: "PATTERSON_DENTAL_SUPPLY_INC",
                },
                vendors: {
                  id: "vendor-patterson",
                  name: "Patterson Dental Supply Inc",
                  vendor_code: "PATTERSON_DENTAL_SUPPLY_INC",
                },
                purchase_order_items: [
                  {
                    id: "po-line-1",
                    purchase_order_id: "po-dentira",
                    inventory_item_id: null,
                    organization_id: "org-dentira",
                    product_id: "product-1",
                    suggested_order_item_id: null,
                    quantity_ordered: 2,
                    quantity_received: 0,
                    unit_price: 7.83,
                    line_total: 15.66,
                    uom: "order-unit",
                    notes:
                      "Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854",
                    status: "open",
                    metadata: {
                      source_line_number: 1,
                      vendor_item_number: "070367854",
                      raw_product_description:
                        "Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854",
                    },
                    created_at: null,
                    updated_at: null,
                    deleted_at: null,
                    products: {
                      id: "product-1",
                      sku: "DENTIRA-PTU317717-001",
                      name: "Braval Nitrile PF Exam Gloves, Lavender Blue, Small",
                      brand_name: "Braval",
                      metadata: {
                        vendor_item_number: "070367854",
                      },
                      manufacturers: {
                        id: "manufacturer-braval",
                        name: "Braval",
                      },
                    },
                  },
                ],
              },
            ],
            error: null,
          };
        },
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/purchase-orders");

  assert.equal(response.status, 200);
  assert.deepEqual(
    observedFilters.filter((filter) => filter.type === "eq"),
    [{ type: "eq", column: "organization_id", value: "org-dentira" }],
  );
  assert.equal(response.body.data[0].po_number, "PTU317717");
  assert.equal(response.body.data[0].order_number, "6209555669");
  assert.equal(
    response.body.data[0].supplier_name,
    "Patterson Dental Supply Inc",
  );
  assert.equal(response.body.data[0].line_item_count, 1);
  assert.equal(response.body.data[0].ordered_unit_count, 2);
  assert.equal(response.body.data[0].status, null);
  assert.equal(response.body.data[0].items[0].vendor_item_number, "070367854");
  assert.equal(response.body.data[0].items[0].brand_or_manufacturer, "Braval");
});

test("GET /api/v1/purchase-orders/:id returns 404 when RLS hides another tenant's row", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      supabase: createFakeSupabase({
        purchase_orders: () => ({ data: null, error: null }),
        purchase_order_items: () => ({ data: [], error: null }),
      }),
    }),
  });

  const response = await supertest(app).get(
    "/api/v1/purchase-orders/d7afe1d1-0e0e-452e-af64-5f985e9a6fa1",
  );

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
});
