import { z } from "zod";

import {
  booleanQuerySchema,
  limitQuerySchema,
  metadataSchema,
  uuidSchema,
} from "./common.js";

export const listInventoryItemsQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  isActive: booleanQuerySchema.optional(),
  limit: limitQuerySchema,
  organizationId: uuidSchema.optional(),
  search: z.string().trim().min(1).optional(),
});

export const createInventoryItemSchema = z.object({
  organizationId: uuidSchema,
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).max(100).optional(),
  subcategory: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).optional(),
  uom: z.string().trim().min(1).max(50).default("unit"),
  unitCost: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).default("USD"),
  supplierId: uuidSchema.optional(),
  manufacturer: z.string().trim().min(1).max(255).optional(),
  modelNumber: z.string().trim().min(1).max(100).optional(),
  trackExpiration: z.boolean().default(true),
  expirationAlertDays: z.number().int().min(0).default(30),
  isActive: z.boolean().default(true),
  imageUrl: z.string().trim().url().optional(),
  notes: z.string().trim().min(1).optional(),
  metadata: metadataSchema.optional(),
});
