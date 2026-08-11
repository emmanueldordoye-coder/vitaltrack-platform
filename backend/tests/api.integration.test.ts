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
  operation: "select" | "insert" | "delete";
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

  public in(column: string, value: unknown) {
    this.state.filters.push({ type: "in", column, value });
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

  public delete() {
    this.state.operation = "delete";
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
  let observedFacilityFilters: QueryState["filters"] = [];

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      userId: "user-current",
      supabase: createFakeSupabase({
        facilities: (state) => {
          observedFacilityFilters = state.filters;

          return {
            data: { id: "b3b9875f-2449-40d6-b825-0866712bce90" },
            error: null,
          };
        },
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
  assert.deepEqual(
    observedFacilityFilters.filter((filter) => filter.type === "eq"),
    [
      {
        type: "eq",
        column: "id",
        value: "b3b9875f-2449-40d6-b825-0866712bce90",
      },
      { type: "eq", column: "organization_id", value: "org-current" },
    ],
  );
  assert.equal(insertedPayload?.created_by, "user-current");
  assert.equal(insertedPayload?.updated_by, "user-current");
  assert.deepEqual(insertedPayload?.metadata, {});
  assert.equal(response.body.data.created_by, "user-current");
});

test("POST /api/v1/purchase-orders rejects facilities outside the authenticated organization", async () => {
  let insertAttempted = false;

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      userId: "user-current",
      supabase: createFakeSupabase({
        facilities: () => ({ data: null, error: null }),
        purchase_orders: () => {
          insertAttempted = true;
          return { data: null, error: null };
        },
      }),
    }),
  });

  const response = await supertest(app).post("/api/v1/purchase-orders").send({
    facilityId: "b3b9875f-2449-40d6-b825-0866712bce90",
    poNumber: "PO-1001",
    poDate: "2026-06-25T12:00:00Z",
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
  assert.equal(insertAttempted, false);
});

test("POST /api/v1/purchase-orders rejects nonexistent facilities before insert", async () => {
  let observedFacilityFilters: QueryState["filters"] = [];
  let insertAttempted = false;

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      userId: "user-current",
      supabase: createFakeSupabase({
        facilities: (state) => {
          observedFacilityFilters = state.filters;
          return { data: null, error: null };
        },
        purchase_orders: () => {
          insertAttempted = true;
          return { data: null, error: null };
        },
      }),
    }),
  });

  const response = await supertest(app).post("/api/v1/purchase-orders").send({
    facilityId: "00000000-0000-0000-0000-000000000404",
    poNumber: "PO-1002",
    poDate: "2026-06-25T12:00:00Z",
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
  assert.deepEqual(
    observedFacilityFilters.filter((filter) => filter.type === "eq"),
    [
      {
        type: "eq",
        column: "id",
        value: "00000000-0000-0000-0000-000000000404",
      },
      { type: "eq", column: "organization_id", value: "org-current" },
    ],
  );
  assert.equal(insertAttempted, false);
});

test("POST /api/v1/purchase-orders creates an internal draft PO from catalog products", async () => {
  const facilityId = "b3b9875f-2449-40d6-b825-0866712bce90";
  const vendorId = "11111111-1111-4111-8111-111111111111";
  const productId = "22222222-2222-4222-8222-222222222222";
  const sourceLineId = "33333333-3333-4333-8333-333333333333";
  let insertedOrder: TableInsert<"purchase_orders"> | undefined;
  let insertedItems: Array<TableInsert<"purchase_order_items">> = [];
  let observedSourceLookup: QueryState["filters"] = [];

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-dentira",
      userId: "user-current",
      supabase: createFakeSupabase({
        facilities: () => ({
          data: { id: facilityId },
          error: null,
        }),
        vendors: () => ({
          data: {
            id: vendorId,
            name: "Patterson Dental Supply Inc",
            vendor_code: "PATTERSON_DENTAL_SUPPLY_INC",
          },
          error: null,
        }),
        purchase_orders: (state) => {
          if (state.operation === "insert") {
            insertedOrder = state.payload as TableInsert<"purchase_orders">;

            return {
              data: {
                id: "po-draft",
                suggested_order_id: null,
                estimated_savings: 0,
                confirmation_number: null,
                deleted_at: null,
                created_at: "2026-08-11T12:00:00Z",
                updated_at: "2026-08-11T12:00:00Z",
                ...insertedOrder,
              },
              error: null,
            };
          }

          return { data: [], error: null };
        },
        purchase_order_items: (state) => {
          if (state.operation === "insert") {
            insertedItems = state.payload as Array<
              TableInsert<"purchase_order_items">
            >;

            return { data: insertedItems, error: null };
          }

          const isSourceLookup = state.filters.some(
            (filter) => filter.type === "in" && filter.column === "id",
          );

          if (isSourceLookup) {
            observedSourceLookup = state.filters;
            return {
              data: [
                {
                  id: sourceLineId,
                  purchase_order_id: "source-po",
                  inventory_item_id: null,
                  organization_id: "org-dentira",
                  product_id: productId,
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
                    id: productId,
                    sku: "DENTIRA-PTU317717-001",
                    name: "Braval Nitrile PF Exam Gloves",
                    description: "Powder Free Lavender Blue Small 300/Pkg",
                    brand_name: "Braval",
                    metadata: {
                      vendor_item_number: "070367854",
                    },
                    manufacturers: {
                      id: "manufacturer-braval",
                      name: "Braval",
                    },
                  },
                  purchase_orders: {
                    id: "source-po",
                    po_number: "PTU317717",
                    currency: "USD",
                    vendor_id: vendorId,
                    organization_id: "org-dentira",
                    metadata: null,
                    vendors: {
                      id: vendorId,
                      name: "Patterson Dental Supply Inc",
                      vendor_code: "PATTERSON_DENTAL_SUPPLY_INC",
                    },
                  },
                },
              ],
              error: null,
            };
          }

          return {
            data: insertedItems.map((item, index) => ({
              id: `draft-line-${index + 1}`,
              created_at: null,
              updated_at: null,
              deleted_at: null,
              suggested_order_item_id: null,
              ...item,
              products: {
                id: productId,
                sku: "DENTIRA-PTU317717-001",
                name: "Braval Nitrile PF Exam Gloves",
                brand_name: "Braval",
                metadata: {
                  vendor_item_number: "070367854",
                },
                manufacturers: {
                  id: "manufacturer-braval",
                  name: "Braval",
                },
              },
            })),
            error: null,
          };
        },
      }),
    }),
  });

  const response = await supertest(app)
    .post("/api/v1/purchase-orders")
    .send({
      facilityId,
      vendorId,
      items: [
        {
          productId,
          sourcePurchaseOrderItemId: sourceLineId,
          quantityOrdered: 2,
        },
      ],
    });

  assert.equal(response.status, 201);
  assert.equal(insertedOrder?.organization_id, "org-dentira");
  assert.equal(insertedOrder?.facility_id, facilityId);
  assert.equal(insertedOrder?.vendor_id, vendorId);
  assert.equal(insertedOrder?.status, "draft");
  assert.equal(insertedOrder?.total_amount, 15.66);
  assert.equal(insertedOrder?.mock_supplier_submission, false);
  assert.deepEqual(
    observedSourceLookup.find((filter) => filter.column === "id"),
    {
      type: "in",
      column: "id",
      value: [sourceLineId],
    },
  );
  assert.match(String(insertedOrder?.po_number), /^VT-DRAFT-/);
  assert.equal(insertedItems.length, 1);
  assert.equal(insertedItems[0].product_id, productId);
  assert.equal(insertedItems[0].inventory_item_id, null);
  assert.equal(insertedItems[0].quantity_ordered, 2);
  assert.equal(insertedItems[0].quantity_received, 0);
  assert.equal(insertedItems[0].unit_price, 7.83);
  assert.equal(insertedItems[0].line_total, 15.66);
  assert.equal(
    (insertedItems[0].metadata as { source_purchase_order_item_id?: string })
      .source_purchase_order_item_id,
    sourceLineId,
  );
  assert.equal(response.body.data.status, "draft");
  assert.equal(response.body.data.total_amount, 15.66);
  assert.equal(
    response.body.data.items[0].product_name,
    "Braval Nitrile PF Exam Gloves",
  );
});

test("POST /api/v1/purchase-orders rejects catalog products outside the selected supplier context", async () => {
  const facilityId = "b3b9875f-2449-40d6-b825-0866712bce90";
  const vendorId = "11111111-1111-4111-8111-111111111111";
  const productId = "22222222-2222-4222-8222-222222222222";
  const sourceLineId = "33333333-3333-4333-8333-333333333333";
  let insertAttempted = false;

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-dentira",
      userId: "user-current",
      supabase: createFakeSupabase({
        facilities: () => ({ data: { id: facilityId }, error: null }),
        vendors: () => ({
          data: { id: vendorId, name: "Patterson Dental Supply Inc" },
          error: null,
        }),
        purchase_order_items: () => ({ data: [], error: null }),
        purchase_orders: () => {
          insertAttempted = true;
          return { data: null, error: null };
        },
      }),
    }),
  });

  const response = await supertest(app)
    .post("/api/v1/purchase-orders")
    .send({
      facilityId,
      vendorId,
      items: [
        {
          productId,
          sourcePurchaseOrderItemId: sourceLineId,
          quantityOrdered: 1,
        },
      ],
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "BAD_REQUEST");
  assert.equal(insertAttempted, false);
});

test("POST /api/v1/purchase-orders rejects mixed source currencies", async () => {
  const facilityId = "b3b9875f-2449-40d6-b825-0866712bce90";
  const vendorId = "11111111-1111-4111-8111-111111111111";
  const productIdOne = "22222222-2222-4222-8222-222222222222";
  const productIdTwo = "44444444-4444-4444-8444-444444444444";
  const sourceLineIdOne = "33333333-3333-4333-8333-333333333333";
  const sourceLineIdTwo = "55555555-5555-4555-8555-555555555555";
  let insertAttempted = false;

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-dentira",
      userId: "user-current",
      supabase: createFakeSupabase({
        facilities: () => ({ data: { id: facilityId }, error: null }),
        vendors: () => ({
          data: { id: vendorId, name: "Patterson Dental Supply Inc" },
          error: null,
        }),
        purchase_orders: () => {
          insertAttempted = true;
          return { data: null, error: null };
        },
        purchase_order_items: () => ({
          data: [
            {
              id: sourceLineIdOne,
              purchase_order_id: "source-po-1",
              inventory_item_id: null,
              organization_id: "org-dentira",
              product_id: productIdOne,
              quantity_ordered: 1,
              quantity_received: 0,
              unit_price: 7.83,
              line_total: 7.83,
              uom: "order-unit",
              notes: "Braval gloves",
              status: "open",
              metadata: null,
              created_at: null,
              updated_at: null,
              deleted_at: null,
              products: {
                id: productIdOne,
                sku: "DENTIRA-001",
                name: "Braval gloves",
                description: null,
                brand_name: "Braval",
                metadata: null,
                manufacturers: null,
              },
              purchase_orders: {
                id: "source-po-1",
                po_number: "PTU317717",
                currency: "USD",
                vendor_id: vendorId,
                organization_id: "org-dentira",
                metadata: null,
                vendors: null,
              },
            },
            {
              id: sourceLineIdTwo,
              purchase_order_id: "source-po-2",
              inventory_item_id: null,
              organization_id: "org-dentira",
              product_id: productIdTwo,
              quantity_ordered: 1,
              quantity_received: 0,
              unit_price: 10,
              line_total: 10,
              uom: "order-unit",
              notes: "Other product",
              status: "open",
              metadata: null,
              created_at: null,
              updated_at: null,
              deleted_at: null,
              products: {
                id: productIdTwo,
                sku: "DENTIRA-002",
                name: "Other product",
                description: null,
                brand_name: null,
                metadata: null,
                manufacturers: null,
              },
              purchase_orders: {
                id: "source-po-2",
                po_number: "PO-EUR",
                currency: "EUR",
                vendor_id: vendorId,
                organization_id: "org-dentira",
                metadata: null,
                vendors: null,
              },
            },
          ],
          error: null,
        }),
      }),
    }),
  });

  const response = await supertest(app)
    .post("/api/v1/purchase-orders")
    .send({
      facilityId,
      vendorId,
      items: [
        {
          productId: productIdOne,
          sourcePurchaseOrderItemId: sourceLineIdOne,
          quantityOrdered: 1,
        },
        {
          productId: productIdTwo,
          sourcePurchaseOrderItemId: sourceLineIdTwo,
          quantityOrdered: 1,
        },
      ],
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "BAD_REQUEST");
  assert.equal(insertAttempted, false);
});

test("POST /api/v1/purchase-orders removes the draft header if item insertion fails", async () => {
  const facilityId = "b3b9875f-2449-40d6-b825-0866712bce90";
  const vendorId = "11111111-1111-4111-8111-111111111111";
  const productId = "22222222-2222-4222-8222-222222222222";
  const sourceLineId = "33333333-3333-4333-8333-333333333333";
  let rollbackAttempted = false;

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-dentira",
      userId: "user-current",
      supabase: createFakeSupabase({
        facilities: () => ({ data: { id: facilityId }, error: null }),
        vendors: () => ({
          data: { id: vendorId, name: "Patterson Dental Supply Inc" },
          error: null,
        }),
        purchase_orders: (state) => {
          if (state.operation === "delete") {
            rollbackAttempted = true;
            return { data: null, error: null };
          }

          if (state.operation === "insert") {
            return {
              data: {
                id: "po-draft",
                suggested_order_id: null,
                estimated_savings: 0,
                confirmation_number: null,
                deleted_at: null,
                created_at: "2026-08-11T12:00:00Z",
                updated_at: "2026-08-11T12:00:00Z",
                ...(state.payload as TableInsert<"purchase_orders">),
              },
              error: null,
            };
          }

          return { data: [], error: null };
        },
        purchase_order_items: (state) => {
          if (state.operation === "insert") {
            return {
              data: null,
              error: {
                message: "item insert failed",
              },
            };
          }

          return {
            data: [
              {
                id: sourceLineId,
                purchase_order_id: "source-po",
                inventory_item_id: null,
                organization_id: "org-dentira",
                product_id: productId,
                quantity_ordered: 1,
                quantity_received: 0,
                unit_price: 7.83,
                line_total: 7.83,
                uom: "order-unit",
                notes: "Braval gloves",
                status: "open",
                metadata: { vendor_item_number: "070367854" },
                created_at: null,
                updated_at: null,
                deleted_at: null,
                products: {
                  id: productId,
                  sku: "DENTIRA-PTU317717-001",
                  name: "Braval Nitrile PF Exam Gloves",
                  description: "Powder Free Lavender Blue Small 300/Pkg",
                  brand_name: "Braval",
                  metadata: null,
                  manufacturers: null,
                },
                purchase_orders: {
                  id: "source-po",
                  po_number: "PTU317717",
                  currency: "USD",
                  vendor_id: vendorId,
                  organization_id: "org-dentira",
                  metadata: null,
                  vendors: null,
                },
              },
            ],
            error: null,
          };
        },
      }),
    }),
  });

  const response = await supertest(app)
    .post("/api/v1/purchase-orders")
    .send({
      facilityId,
      vendorId,
      items: [
        {
          productId,
          sourcePurchaseOrderItemId: sourceLineId,
          quantityOrdered: 1,
        },
      ],
    });

  assert.equal(response.status, 500);
  assert.equal(rollbackAttempted, true);
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
        facilities: () => ({
          data: [{ id: "facility-dentira" }],
          error: null,
        }),
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
  assert.equal(
    observedFilters.find((filter) => filter.type === "or")?.value,
    "organization_id.eq.org-dentira,and(organization_id.is.null,facility_id.in.(facility-dentira))",
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

test("GET /api/v1/purchase-orders includes same-organization and same-facility legacy rows", async () => {
  let observedFilters: QueryState["filters"] = [];

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      supabase: createFakeSupabase({
        facilities: () => ({
          data: [{ id: "facility-current" }],
          error: null,
        }),
        purchase_orders: (state) => {
          observedFilters = state.filters;

          return {
            data: [
              {
                id: "po-current",
                organization_id: "org-current",
                facility_id: "facility-current",
                po_number: "PO-CURRENT",
                po_date: "2026-06-25T12:00:00Z",
                status: "draft",
                total_amount: null,
                currency: "USD",
                metadata: null,
                deleted_at: null,
                purchase_order_items: [],
              },
              {
                id: "po-legacy",
                organization_id: null,
                facility_id: "facility-current",
                po_number: "PO-LEGACY",
                po_date: "2026-06-25T12:00:00Z",
                status: "draft",
                total_amount: null,
                currency: "USD",
                metadata: null,
                deleted_at: null,
                purchase_order_items: [],
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
    response.body.data.map((order: { po_number: string }) => order.po_number),
    ["PO-CURRENT", "PO-LEGACY"],
  );
  assert.equal(
    observedFilters.find((filter) => filter.type === "or")?.value,
    "organization_id.eq.org-current,and(organization_id.is.null,facility_id.in.(facility-current))",
  );
});

test("GET /api/v1/purchase-orders does not include legacy rows from other-organization facilities", async () => {
  let observedFilters: QueryState["filters"] = [];

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      supabase: createFakeSupabase({
        facilities: () => ({
          data: [{ id: "facility-current" }],
          error: null,
        }),
        purchase_orders: (state) => {
          observedFilters = state.filters;
          const tenantFilter = String(
            state.filters.find((filter) => filter.type === "or")?.value ?? "",
          );

          return {
            data: tenantFilter.includes("facility-foreign")
              ? [
                  {
                    id: "po-foreign",
                    organization_id: null,
                    facility_id: "facility-foreign",
                    po_number: "PO-FOREIGN",
                    po_date: "2026-06-25T12:00:00Z",
                    status: "draft",
                    total_amount: null,
                    currency: "USD",
                    metadata: null,
                    deleted_at: null,
                    purchase_order_items: [],
                  },
                ]
              : [],
            error: null,
          };
        },
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/purchase-orders");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, []);
  assert.equal(
    observedFilters.find((filter) => filter.type === "or")?.value,
    "organization_id.eq.org-current,and(organization_id.is.null,facility_id.in.(facility-current))",
  );
});

test("GET /api/v1/purchase-orders/:id returns 404 when RLS hides another tenant's row", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      supabase: createFakeSupabase({
        facilities: () => ({ data: [], error: null }),
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

test("GET /api/v1/product-catalog maps PO-backed product identity without inventory fields", async () => {
  let observedFilters: QueryState["filters"] = [];

  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-dentira",
      supabase: createFakeSupabase({
        purchase_order_items: (state) => {
          observedFilters = state.filters;

          return {
            data: [
              {
                id: "poi-1",
                purchase_order_id: "po-1",
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
                  source: "dentira_po_ptu317717",
                  source_line_number: 1,
                  raw_product_description:
                    "Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854",
                  normalized_product_name:
                    "Braval Nitrile PF Exam Gloves, Lavender Blue, Small",
                  brand_or_manufacturer: "Braval",
                  vendor_item_number: "070367854",
                  image_source: "IMG_4093.PNG",
                  image_source_page: "1/4",
                },
                created_at: "2026-07-01T00:00:00Z",
                updated_at: "2026-07-01T00:00:00Z",
                deleted_at: null,
                products: {
                  id: "product-1",
                  sku: "DENTIRA-PTU317717-001",
                  name: "Braval Nitrile PF Exam Gloves, Lavender Blue, Small",
                  description:
                    "Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg",
                  manufacturer_part_number: "070367854",
                  brand_name: "Braval",
                  metadata: {
                    vendor_item_number: "070367854",
                  },
                  manufacturers: {
                    id: "manufacturer-1",
                    name: "Braval",
                  },
                },
                purchase_orders: {
                  id: "po-1",
                  po_number: "PTU317717",
                  po_date: "2026-06-12T00:00:00Z",
                  confirmation_number: null,
                  currency: "USD",
                  metadata: {
                    supplier: "PATTERSON DENTAL SUPPLY INC",
                    dentira_order_number: "6209555669",
                  },
                  vendors: {
                    id: "vendor-1",
                    name: "Patterson Dental Supply Inc",
                    vendor_code: "PATTERSON_DENTAL_SUPPLY_INC",
                  },
                },
              },
            ],
            error: null,
          };
        },
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/product-catalog");

  assert.equal(response.status, 200);
  assert.deepEqual(
    observedFilters.filter((filter) => filter.type === "eq"),
    [
      { type: "eq", column: "organization_id", value: "org-dentira" },
      { type: "eq", column: "products.organization_id", value: "org-dentira" },
      {
        type: "eq",
        column: "purchase_orders.organization_id",
        value: "org-dentira",
      },
    ],
  );
  assert.equal(response.body.data[0].product_id, "product-1");
  assert.equal(response.body.data[0].source_po_number, "PTU317717");
  assert.equal(response.body.data[0].source_order_number, "6209555669");
  assert.equal(
    response.body.data[0].supplier_name,
    "Patterson Dental Supply Inc",
  );
  assert.equal(response.body.data[0].vendor_item_number, "070367854");
  assert.equal(response.body.data[0].brand_or_manufacturer, "Braval");
  assert.equal(response.body.data[0].last_known_unit_price, 7.83);
  assert.equal(
    response.body.data[0].image_strategy,
    "source-screenshot-reference",
  );
  assert.equal("current_quantity" in response.body.data[0], false);
  assert.equal("par_level" in response.body.data[0], false);
  assert.equal("reorder_point" in response.body.data[0], false);
  assert.equal("is_low_stock" in response.body.data[0], false);
});

test("GET /api/v1/product-catalog searches source-backed product identity fields", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-dentira",
      supabase: createFakeSupabase({
        purchase_order_items: () => ({
          data: [
            {
              id: "poi-1",
              purchase_order_id: "po-1",
              inventory_item_id: null,
              organization_id: "org-dentira",
              product_id: "product-1",
              suggested_order_item_id: null,
              quantity_ordered: 1,
              quantity_received: 0,
              unit_price: 299.99,
              line_total: 299.99,
              uom: "order-unit",
              notes: "Solmetex NXT Hg5 Collection Container With Recycle Kit",
              status: "open",
              metadata: {
                source_line_number: 8,
                vendor_item_number: "NXTHG5002CR",
                brand_or_manufacturer: "Solmetex",
              },
              created_at: null,
              updated_at: null,
              deleted_at: null,
              products: {
                id: "product-1",
                sku: "DENTIRA-PTU317717-008",
                name: "Solmetex NXT Hg5 Collection Container With Recycle Kit",
                description: null,
                manufacturer_part_number: "NXTHG5002CR",
                brand_name: "Solmetex",
                metadata: {},
                manufacturers: null,
              },
              purchase_orders: {
                id: "po-1",
                po_number: "PTU317717",
                po_date: "2026-06-12T00:00:00Z",
                confirmation_number: null,
                currency: "USD",
                metadata: {
                  supplier: "PATTERSON DENTAL SUPPLY INC",
                },
                vendors: {
                  id: "vendor-1",
                  name: "Patterson Dental Supply Inc",
                  vendor_code: "PATTERSON_DENTAL_SUPPLY_INC",
                },
              },
            },
            {
              id: "poi-2",
              purchase_order_id: "po-1",
              inventory_item_id: null,
              organization_id: "org-dentira",
              product_id: "product-2",
              suggested_order_item_id: null,
              quantity_ordered: 1,
              quantity_received: 0,
              unit_price: 13.75,
              line_total: 13.75,
              uom: "order-unit",
              notes: "Reli Disposable Safety Retractor Scalpel #15",
              status: "open",
              metadata: {
                source_line_number: 42,
                vendor_item_number: "6008TR15",
                brand_or_manufacturer: "Myco",
              },
              created_at: null,
              updated_at: null,
              deleted_at: null,
              products: {
                id: "product-2",
                sku: "DENTIRA-PTU317717-042",
                name: "Reli Disposable Safety Retractor Scalpel #15 Sterile",
                description: null,
                manufacturer_part_number: "6008TR15",
                brand_name: "Myco",
                metadata: {},
                manufacturers: null,
              },
              purchase_orders: {
                id: "po-1",
                po_number: "PTU317717",
                po_date: "2026-06-12T00:00:00Z",
                confirmation_number: null,
                currency: "USD",
                metadata: null,
                vendors: {
                  id: "vendor-1",
                  name: "Patterson Dental Supply Inc",
                  vendor_code: "PATTERSON_DENTAL_SUPPLY_INC",
                },
              },
            },
          ],
          error: null,
        }),
      }),
    }),
  });

  const response = await supertest(app).get(
    "/api/v1/product-catalog?search=NXTHG5002CR",
  );

  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 1);
  assert.equal(
    response.body.data[0].product_name,
    "Solmetex NXT Hg5 Collection Container With Recycle Kit",
  );
});
