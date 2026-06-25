import { z } from "zod";

import {
  isoDateSchema,
  isoDateTimeSchema,
  limitQuerySchema,
  uuidSchema,
} from "./common.js";

export const purchaseOrderItemSchema = z.object({
  inventoryItemId: uuidSchema,
  quantityOrdered: z.number().positive(),
  quantityReceived: z.number().min(0).default(0),
  unitPrice: z.number().nonnegative().optional(),
  lineTotal: z.number().nonnegative().optional(),
  uom: z.string().trim().min(1).max(50).optional(),
  notes: z.string().trim().min(1).optional(),
});

export const listPurchaseOrdersQuerySchema = z.object({
  facilityId: uuidSchema.optional(),
  limit: limitQuerySchema,
  status: z.string().trim().min(1).optional(),
  supplierId: uuidSchema.optional(),
});

export const createPurchaseOrderSchema = z.object({
  facilityId: uuidSchema,
  supplierId: uuidSchema.optional(),
  poNumber: z.string().trim().min(1).max(100),
  poDate: isoDateTimeSchema,
  expectedDeliveryDate: isoDateSchema.optional(),
  actualDeliveryDate: isoDateSchema.optional(),
  status: z
    .enum(["draft", "submitted", "confirmed", "shipped", "received", "cancelled"])
    .default("draft"),
  totalAmount: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).default("USD"),
  notes: z.string().trim().min(1).optional(),
});
