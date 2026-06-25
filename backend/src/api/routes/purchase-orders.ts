import type { SupabaseClient } from "@supabase/supabase-js";
import { Router } from "express";
import { z } from "zod";

import type { Database, TableInsert, TableRow } from "../../types/database.js";
import { createNotFoundError } from "../errors.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../response.js";
import { handleRoute } from "../route-handler.js";
import { idParamSchema } from "../schemas/common.js";
import {
  createPurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
} from "../schemas/purchase-orders.js";
import { throwSupabaseError } from "../supabase-errors.js";

type PurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersQuerySchema>;
type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
type PurchaseOrderRow = TableRow<"purchase_orders">;

const attachItems = async (
  reqSupabase: SupabaseClient<Database>,
  purchaseOrder: PurchaseOrderRow,
) => {
  const { data: items, error } = await reqSupabase
    .from("purchase_order_items")
    .select("*")
    .eq("purchase_order_id", purchaseOrder.id)
    .order("id", { ascending: true });

  if (error) {
    throwSupabaseError("Unable to load purchase order items.", error);
  }

  return {
    ...purchaseOrder,
    items: items ?? [],
  };
};

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get(
  "/",
  validate({ query: listPurchaseOrdersQuerySchema }),
  handleRoute(async (req, res) => {
    const { facilityId, limit, status, supplierId } =
      req.context.validated?.query as PurchaseOrdersQuery;

    let query = req.context.supabase
      .from("purchase_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (supplierId) {
      query = query.eq("supplier_id", supplierId);
    }

    const { data, error } = await query;

    if (error) {
      throwSupabaseError("Unable to list purchase orders.", error);
    }

    sendSuccess(req, res, data ?? []);
  }),
);

purchaseOrdersRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  handleRoute(async (req, res) => {
    const { id } = req.context.validated?.params as z.infer<typeof idParamSchema>;

    const { data, error } = await req.context.supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throwSupabaseError("Unable to load the purchase order.", error);
    }

    if (!data) {
      throw createNotFoundError("Purchase order");
    }

    sendSuccess(req, res, await attachItems(req.context.supabase, data));
  }),
);

purchaseOrdersRouter.post(
  "/",
  validate({ body: createPurchaseOrderSchema }),
  handleRoute(async (req, res) => {
    const body = req.context.validated?.body as CreatePurchaseOrderInput;

    const purchaseOrderPayload: TableInsert<"purchase_orders"> = {
      facility_id: body.facilityId,
      supplier_id: body.supplierId ?? null,
      po_number: body.poNumber,
      po_date: body.poDate,
      expected_delivery_date: body.expectedDeliveryDate ?? null,
      actual_delivery_date: body.actualDeliveryDate ?? null,
      status: body.status,
      total_amount: body.totalAmount ?? null,
      currency: body.currency.toUpperCase(),
      notes: body.notes ?? null,
      created_by: req.context.user?.id ?? null,
      updated_by: req.context.user?.id ?? null,
    };

    const { data: createdOrder, error: purchaseOrderError } = await req.context.supabase
      .from("purchase_orders")
      .insert(purchaseOrderPayload)
      .select("*")
      .single();

    if (purchaseOrderError) {
      throwSupabaseError("Unable to create the purchase order.", purchaseOrderError);
    }

    sendSuccess(req, res, createdOrder, 201);
  }),
);
