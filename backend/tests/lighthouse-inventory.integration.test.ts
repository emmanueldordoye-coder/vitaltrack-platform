import assert from "node:assert/strict";
import test from "node:test";

import type { RequestHandler } from "express";
import supertest from "supertest";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";

const { createApp } = await import("../src/app.js");

type QueryState = {
  table: string;
  filters: Array<{
    type: string;
    column?: string;
    value?: unknown;
    options?: unknown;
  }>;
  limit?: number;
};

type QueryResult = {
  data: unknown;
  error: null | { code?: string; message: string };
};

type QueryHandler = (state: QueryState) => QueryResult | Promise<QueryResult>;

class FakeQueryBuilder implements PromiseLike<QueryResult> {
  private readonly state: QueryState;

  public constructor(
    table: string,
    private readonly handler: QueryHandler,
  ) {
    this.state = {
      table,
      filters: [],
    };
  }

  public select() {
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

  public or(value: string, options?: unknown) {
    this.state.filters.push({ type: "or", value, options });
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

const createFakeSupabase = (handlers: Record<string, QueryHandler>) => ({
  from(table: string) {
    const handler = handlers[table];

    if (!handler) {
      throw new Error(
        `No fake Supabase handler registered for table "${table}".`,
      );
    }

    return new FakeQueryBuilder(table, handler);
  },
});

const createRequestContextMiddleware = ({
  organizationId = "org-current",
  supabase,
}: {
  organizationId?: string;
  supabase: ReturnType<typeof createFakeSupabase>;
}): RequestHandler => {
  return (req, _res, next) => {
    req.context = {
      requestId: "req-test",
      accessToken: "token-123",
      organizationId,
      supabase: supabase as never,
      user: {
        id: "user-current",
      } as never,
      validated: {},
    };

    next();
  };
};

test("GET /api/v1/inventory maps Lighthouse catalog and inventory fields", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      supabase: createFakeSupabase({
        inventory_levels: () => ({
          data: [
            {
              product_id: "product-1",
              current_quantity: "18",
              par_level: "60",
              reorder_point: "30",
              location_id: "location-1",
              products: {
                id: "product-1",
                sku: "PAT-GLV-NIT-M",
                name: "Nitrile Exam Gloves, Medium",
                manufacturer_part_number: "PDS-GLV-NIT-M",
                metadata: {
                  primary_vendor_code: "PATTERSON_DENTAL",
                  unit_cost: 12.5,
                },
              },
              locations: {
                id: "location-1",
                name: "Operatory Cabinet A",
              },
            },
          ],
          error: null,
        }),
        vendors: () => ({
          data: [
            {
              id: "vendor-1",
              name: "Patterson Dental",
              vendor_code: "PATTERSON_DENTAL",
            },
          ],
          error: null,
        }),
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/inventory?limit=50");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data[0], {
    product_id: "product-1",
    sku: "PAT-GLV-NIT-M",
    product_name: "Nitrile Exam Gloves, Medium",
    manufacturer_part_number: "PDS-GLV-NIT-M",
    current_quantity: 18,
    par_level: 60,
    reorder_point: 30,
    location_id: "location-1",
    location_name: "Operatory Cabinet A",
    vendor_id: "vendor-1",
    vendor_name: "Patterson Dental",
    unit_cost: 12.5,
    is_low_stock: true,
  });
});

test("GET /api/v1/inventory applies tenant filters to Lighthouse inventory and vendors", async () => {
  const observedStates: QueryState[] = [];
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      organizationId: "org-current",
      supabase: createFakeSupabase({
        inventory_levels: (state) => {
          observedStates.push(state);
          return { data: [], error: null };
        },
        vendors: (state) => {
          observedStates.push(state);
          return { data: [], error: null };
        },
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/inventory?limit=25");

  assert.equal(response.status, 200);
  assert.ok(
    observedStates.some(
      (state) =>
        state.table === "inventory_levels" &&
        state.filters.some(
          (filter) =>
            filter.type === "eq" &&
            filter.column === "organization_id" &&
            filter.value === "org-current",
        ) &&
        state.filters.some(
          (filter) =>
            filter.type === "eq" &&
            filter.column === "facilities.organization_id" &&
            filter.value === "org-current",
        ),
    ),
  );
  assert.ok(
    observedStates.some(
      (state) =>
        state.table === "vendors" &&
        state.filters.some(
          (filter) =>
            filter.type === "eq" &&
            filter.column === "organization_id" &&
            filter.value === "org-current",
        ),
    ),
  );
});

test("GET /api/v1/inventory marks rows above reorder point as in stock", async () => {
  const app = createApp({
    requestContextMiddleware: createRequestContextMiddleware({
      supabase: createFakeSupabase({
        inventory_levels: () => ({
          data: [
            {
              product_id: "product-2",
              current_quantity: 42,
              par_level: 60,
              reorder_point: 30,
              location_id: "location-2",
              products: {
                id: "product-2",
                sku: "PAT-FLUOR-VARN",
                name: "Fluoride Varnish Unit Dose",
                manufacturer_part_number: "PDS-FLUOR-VARN",
                metadata: {},
              },
              locations: {
                id: "location-2",
                name: "Supply Closet",
              },
            },
          ],
          error: null,
        }),
        vendors: () => ({ data: [], error: null }),
      }),
    }),
  });

  const response = await supertest(app).get("/api/v1/inventory?limit=25");

  assert.equal(response.status, 200);
  assert.equal(response.body.data[0].is_low_stock, false);
});
