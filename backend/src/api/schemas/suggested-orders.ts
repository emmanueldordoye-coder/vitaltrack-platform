import { z } from "zod";

import { limitQuerySchema, uuidSchema, booleanQuerySchema } from "./common.js";

// ─── Catalog ─────────────────────────────────────────────────────────────────

/** Query params for GET /catalog */
export const listCatalogQuerySchema = z.object({
  /** Scope stock-level data to a specific facility. */
  facilityId: uuidSchema.optional(),
  /** Free-text search on name or SKU. */
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  isActive: booleanQuerySchema.optional(),
  limit: limitQuerySchema,
});

// ─── Suggested Orders ────────────────────────────────────────────────────────

/** Body for POST /suggested-orders/generate */
export const generateSuggestedOrderSchema = z.object({
  /** Facility to check stock levels for. */
  facilityId: uuidSchema,
  notes: z.string().trim().optional(),
});

/** Query params for GET /suggested-orders */
export const listSuggestedOrdersQuerySchema = z.object({
  facilityId: uuidSchema.optional(),
  status: z
    .enum(["pending_review", "approved", "submitted", "rejected"])
    .optional(),
  limit: limitQuerySchema,
});

/** Body for POST /suggested-orders/:id/approve */
export const approveSuggestedOrderSchema = z.object({
  notes: z.string().trim().optional(),
});
