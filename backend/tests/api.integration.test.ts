import assert from "node:assert/strict";
import test from "node:test";

import type { RequestHandler } from "express";
import supertest from "supertest";

import type { Database, TableInsert } from "../src/types/database.js";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";

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
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
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
      throw new Error(`No fake Supabase handler registered for table "${table}".`);
    }

    return new FakeQueryBuilder(table, handler);
  },
});

const createRequestContextMiddleware = ({
  accessToken = "token-123",
  organizationId = "org-123",
  userId = "user-123",
  supabase = createFakeSupabase({}),
}: {
  accessToken?: string;
  organizationId?: string;
  userId?: string;
  supabase?: ReturnType<typeof createFakeSupabase>;
}): RequestHandler => {
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

  const response = await supertest(app)
    .post("/api/v1/facilities")
    .send({
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
  assert.equal(response.body.error.code, "UNAUTHORIZED");
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
  assert.equal(response.body.error.code, "FORBIDDEN");
});

test("GET /api/v1/facilities/:id returns 404 when RLS hides another tenant's row", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      supabase: createFakeSupabase({
        facilities: () => ({ data: null, error: null }),
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/facilities/f91020dc-986f-4027-b3ea-b9e4391129fd");

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

  const response = await supertest(app)
    .post("/api/v1/inventory")
    .send({
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
  assert.equal(response.body.error.code, "UNAUTHORIZED");
});

test("GET /api/v1/inventory/:id returns 404 when RLS hides another tenant's row", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      supabase: createFakeSupabase({
        inventory_items: () => ({ data: null, error: null }),
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/inventory/458a690b-dc0d-4374-a177-f3f467f34994");

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

  const response = await supertest(app)
    .post("/api/v1/purchase-orders")
    .send({
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
  assert.equal(response.body.error.code, "UNAUTHORIZED");
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

  const response = await supertest(app).get("/api/v1/purchase-orders/d7afe1d1-0e0e-452e-af64-5f985e9a6fa1");

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
});
