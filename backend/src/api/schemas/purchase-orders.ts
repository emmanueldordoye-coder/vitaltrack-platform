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

const createPurchaseOrderItemSchema = z.object({
  productId: uuidSchema,
  quantityOrdered: z.number().int().positive().max(999),
});

export const listPurchaseOrdersQuerySchema = z.object({
  facilityId: uuidSchema.optional(),
  limit: limitQuerySchema,
  status: z.string().trim().min(1).optional(),
  supplierId: uuidSchema.optional(),
});

export const createPurchaseOrderSchema = z
  .object({
    facilityId: uuidSchema,
    supplierId: uuidSchema.optional(),
    vendorId: uuidSchema.optional(),
    poNumber: z.string().trim().min(1).max(100).optional(),
    poDate: isoDateTimeSchema.optional(),
    expectedDeliveryDate: isoDateSchema.optional(),
    actualDeliveryDate: isoDateSchema.optional(),
    status: z
      .enum([
        "draft",
        "submitted",
        "confirmed",
        "shipped",
        "received",
        "cancelled",
      ])
      .default("draft"),
    totalAmount: z.number().nonnegative().optional(),
    currency: z.string().trim().length(3).default("USD"),
    notes: z.string().trim().min(1).optional(),
    items: z.array(createPurchaseOrderItemSchema).max(50).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.items?.length) {
      if (!value.vendorId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A vendor is required to create a catalog draft PO.",
          path: ["vendorId"],
        });
      }

      return;
    }

    if (!value.poNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PO number is required when no catalog items are provided.",
        path: ["poNumber"],
      });
    }

    if (!value.poDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PO date is required when no catalog items are provided.",
        path: ["poDate"],
      });
    }
  });
