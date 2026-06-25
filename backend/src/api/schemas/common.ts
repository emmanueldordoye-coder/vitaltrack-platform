import { z } from "zod";

import type { Json } from "../../types/database.js";

export const uuidSchema = z.string().uuid();

export const isoDateSchema = z.string().refine(
  (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
  "Expected an ISO date in YYYY-MM-DD format.",
);

export const isoDateTimeSchema = z.string().refine(
  (value) =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) && !Number.isNaN(Date.parse(value)),
  "Expected an ISO date-time string.",
);

export const booleanQuerySchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return value;
}, z.boolean());

export const limitQuerySchema = z.coerce.number().int().min(1).max(100).default(25);

export const idParamSchema = z.object({
  id: uuidSchema,
});

const jsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

export const metadataSchema = z.record(jsonValueSchema).default({});
