/**
 * Suggested-order routes — the core of the Lighthouse procurement workflow.
 *
 * POST /generate       Detect low-stock items and create a suggested order.
 * GET  /               List suggested orders for the org.
 * GET  /:id            Get a single suggested order with its line items.
 * POST /:id/approve    Approve → create purchase_order → mock submit to supplier.
 */
import { Router } from "express";
import { z } from "zod";

import type { TableInsert } from "../../types/database.js";
import { AppError, createNotFoundError } from "../errors.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../response.js";
import { handleRoute } from "../route-handler.js";
import { idParamSchema } from "../schemas/common.js";
import {
  approveSuggestedOrderSchema,
  generateSuggestedOrderSchema,
  listSuggestedOrdersQuerySchema,
} from "../schemas/suggested-orders.js";
import { throwSupabaseError } from "../supabase-errors.js";

type GenerateInput = z.infer<typeof generateSuggestedOrderSchema>;
type ListQuery = z.infer<typeof listSuggestedOrdersQuerySchema>;
type ApproveInput = z.infer<typeof approveSuggestedOrderSchema>;

export const suggestedOrdersRouter = Router();

// ─── GET / ────────────────────────────────────────────────────────────────────
// List suggested orders for the authenticated user's org.

suggestedOrdersRouter.get(
  "/",
  validate({ query: listSuggestedOrdersQuerySchema }),
  handleRoute(async (req, res) => {
    const { facilityId, status, limit } =
      req.context.validated?.query as ListQuery;

    let query = req.context.supabase
      .from("suggested_orders")
      .select("*, supplier:suppliers(id, name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      throwSupabaseError("Unable to list suggested orders.", error);
    }

    sendSuccess(req, res, data ?? []);
  }),
);

// ─── POST /generate ───────────────────────────────────────────────────────────
// Scan stock levels for a facility, group low-stock items by supplier, and
// create one suggested_order (with line items) per supplier.
// Returns the array of created suggested orders.

suggestedOrdersRouter.post(
  "/generate",
  validate({ body: generateSuggestedOrderSchema }),
  handleRoute(async (req, res) => {
    const { facilityId, notes } =
      req.context.validated?.body as GenerateInput;

    const orgId = req.context.organizationId!;

    // 1. Fetch all stock levels for the facility (RLS scopes to the org)
    const { data: stockLevels, error: slError } = await req.context.supabase
      .from("stock_levels")
      .select("inventory_item_id, available_quantity, reorder_level, reorder_quantity")
      .eq("facility_id", facilityId);

    if (slError) {
      throwSupabaseError("Unable to read stock levels.", slError);
    }

    // 2. Filter in JS: items whose available qty is at or below the reorder level
    const lowStock = (stockLevels ?? []).filter(
      (sl) =>
        sl.available_quantity !== null &&
        sl.reorder_level !== null &&
        sl.available_quantity <= sl.reorder_level,
    );

    if (lowStock.length === 0) {
      // Nothing to order — return an informational empty result
      return sendSuccess(req, res, {
        message: "No low-stock items detected for this facility.",
        orders: [],
      });
    }

    const itemIds = lowStock.map((sl) => sl.inventory_item_id);

    // 3. Fetch inventory item details for all low-stock items
    const { data: inventoryItems, error: iiError } = await req.context.supabase
      .from("inventory_items")
      .select("id, name, sku, uom, unit_cost, supplier_id")
      .in("id", itemIds)
      .eq("is_active", true);

    if (iiError) {
      throwSupabaseError("Unable to read inventory items.", iiError);
    }

    // 4. Fetch reorder rules (preferred source for quantity and supplier)
    const { data: reorderRules, error: rrError } = await req.context.supabase
      .from("reorder_rules")
      .select("inventory_item_id, supplier_id, reorder_quantity")
      .eq("facility_id", facilityId)
      .in("inventory_item_id", itemIds)
      .eq("is_active", true);

    if (rrError) {
      throwSupabaseError("Unable to read reorder rules.", rrError);
    }

    // Build fast lookup maps
    const ruleByItemId = new Map(
      (reorderRules ?? []).map((r) => [r.inventory_item_id, r]),
    );
    const stockByItemId = new Map(
      lowStock.map((sl) => [sl.inventory_item_id, sl]),
    );
    const itemById = new Map((inventoryItems ?? []).map((i) => [i.id, i]));

    // 5. Group low-stock items by supplier so we create one order per supplier
    const bySupplier = new Map<string | null, string[]>();
    for (const itemId of itemIds) {
      const rule = ruleByItemId.get(itemId);
      const item = itemById.get(itemId);
      // Prefer the reorder rule's supplier, fall back to the item's default supplier
      const supplierId = rule?.supplier_id ?? item?.supplier_id ?? null;
      const key = supplierId ?? "__none__";
      const group = bySupplier.get(key) ?? [];
      group.push(itemId);
      bySupplier.set(key, group);
    }

    // 6. Create one suggested_order per supplier group
    const createdOrders = [];

    for (const [supplierKey, groupItemIds] of bySupplier.entries()) {
      const supplierId = supplierKey === "__none__" ? null : supplierKey;

      // Create the order header
      const orderPayload: TableInsert<"suggested_orders"> = {
        organization_id: orgId,
        facility_id: facilityId,
        supplier_id: supplierId,
        status: "pending_review",
        notes: notes ?? null,
      };

      const { data: order, error: orderError } = await req.context.supabase
        .from("suggested_orders")
        .insert(orderPayload)
        .select("*")
        .single();

      if (orderError) {
        throwSupabaseError("Unable to create suggested order.", orderError);
      }

      // Build line items for this supplier's items
      const lineItems: TableInsert<"suggested_order_items">[] = groupItemIds.map(
        (itemId) => {
          const sl = stockByItemId.get(itemId);
          const rule = ruleByItemId.get(itemId);
          const item = itemById.get(itemId);

          // Use reorder rule qty, fall back to stock level reorder_quantity, then default to 1
          const qty = rule?.reorder_quantity ?? sl?.reorder_quantity ?? 1;
          const unitPrice = item?.unit_cost ?? null;
          const lineTotal =
            unitPrice !== null ? Math.round(qty * unitPrice * 100) / 100 : null;

          return {
            suggested_order_id: order!.id,
            inventory_item_id: itemId,
            quantity_suggested: qty,
            unit_price: unitPrice,
            line_total: lineTotal,
            uom: item?.uom ?? null,
          };
        },
      );

      const { error: itemsError } = await req.context.supabase
        .from("suggested_order_items")
        .insert(lineItems);

      if (itemsError) {
        throwSupabaseError("Unable to create suggested order items.", itemsError);
      }

      // Calculate total and patch the header
      const total = lineItems.reduce((sum, li) => sum + (li.line_total ?? 0), 0);
      const { error: updateError } = await req.context.supabase
        .from("suggested_orders")
        .update({ total_estimated_cost: Math.round(total * 100) / 100 })
        .eq("id", order!.id);

      if (updateError) {
        throwSupabaseError("Unable to update order total.", updateError);
      }

      createdOrders.push({ ...order, total_estimated_cost: total, items: lineItems });
    }

    sendSuccess(req, res, { orders: createdOrders }, 201);
  }),
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────
// Return a suggested order with full line items and nested product details.

suggestedOrdersRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  handleRoute(async (req, res) => {
    const { id } = req.context.validated?.params as z.infer<typeof idParamSchema>;

    const { data: order, error: orderError } = await req.context.supabase
      .from("suggested_orders")
      .select("*, supplier:suppliers(id, name, email, phone)")
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      throwSupabaseError("Unable to load the suggested order.", orderError);
    }
    if (!order) {
      throw createNotFoundError("Suggested order");
    }

    // Fetch line items with nested inventory-item data
    const { data: items, error: itemsError } = await req.context.supabase
      .from("suggested_order_items")
      .select("*, inventory_item:inventory_items(id, sku, name, category, uom, unit_cost)")
      .eq("suggested_order_id", id)
      .order("id", { ascending: true });

    if (itemsError) {
      throwSupabaseError("Unable to load order items.", itemsError);
    }

    sendSuccess(req, res, { ...order, items: items ?? [] });
  }),
);

// ─── POST /:id/approve ────────────────────────────────────────────────────────
// Approve a pending suggested order:
//   1. Validates status is pending_review.
//   2. Creates a formal purchase_order with line items.
//   3. Updates the suggested_order (status → submitted, links purchase_order_id).
//   4. Returns a purchase-confirmation object — the last step in the workflow.
//
// The supplier submission is currently mocked (no external API call).
// A future engineer can replace the mock section with a real Patterson EDI call.

suggestedOrdersRouter.post(
  "/:id/approve",
  validate({ params: idParamSchema, body: approveSuggestedOrderSchema }),
  handleRoute(async (req, res) => {
    const { id } = req.context.validated?.params as z.infer<typeof idParamSchema>;
    const { notes } = req.context.validated?.body as ApproveInput;

    // Load the suggested order
    const { data: order, error: orderError } = await req.context.supabase
      .from("suggested_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      throwSupabaseError("Unable to load the suggested order.", orderError);
    }
    if (!order) {
      throw createNotFoundError("Suggested order");
    }

    // Guard: only pending_review orders can be approved
    if (order.status !== "pending_review") {
      throw new AppError({
        statusCode: 422,
        code: "ORDER_NOT_REVIEWABLE",
        message: `This suggested order cannot be approved. Current status: ${order.status}.`,
      });
    }

    // Fetch line items
    const { data: items, error: itemsError } = await req.context.supabase
      .from("suggested_order_items")
      .select("*")
      .eq("suggested_order_id", id);

    if (itemsError) {
      throwSupabaseError("Unable to load order items.", itemsError);
    }

    const lineItems = items ?? [];
    const now = new Date().toISOString();

    // ── Mock supplier submission ──────────────────────────────────────────────
    // TODO: Replace with a real Patterson Dental EDI / API call.
    // The block below simulates the submission step:
    //   - In production, send order data to the supplier's endpoint here.
    //   - Store the supplier's confirmation reference number on the PO.
    // ─────────────────────────────────────────────────────────────────────────

    const supplierRefNumber = `PAT-${Date.now().toString(36).toUpperCase()}`;
    const estimatedDeliveryDays = 3; // Patterson Dental standard lead time

    // Generate a Lighthouse PO number
    const poNumber = `PO-LH-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;

    const totalAmount =
      lineItems.reduce((sum, li) => sum + (li.line_total ?? 0), 0);

    // Create the formal purchase order
    const poPayload: TableInsert<"purchase_orders"> = {
      facility_id: order.facility_id,
      supplier_id: order.supplier_id,
      po_number: poNumber,
      po_date: now,
      expected_delivery_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + estimatedDeliveryDays);
        return d.toISOString().split("T")[0];
      })(),
      status: "submitted",
      total_amount: Math.round(totalAmount * 100) / 100,
      currency: "USD",
      notes: [
        notes,
        `Auto-generated from Lighthouse suggested order ${id}.`,
        `Supplier ref: ${supplierRefNumber}`,
      ]
        .filter(Boolean)
        .join(" | "),
      created_by: req.context.user?.id ?? null,
      updated_by: req.context.user?.id ?? null,
    };

    const { data: purchaseOrder, error: poError } = await req.context.supabase
      .from("purchase_orders")
      .insert(poPayload)
      .select("*")
      .single();

    if (poError) {
      throwSupabaseError("Unable to create the purchase order.", poError);
    }

    // Create purchase order line items (use quantity_approved if set, else quantity_suggested)
    const poItems: TableInsert<"purchase_order_items">[] = lineItems.map((li) => ({
      purchase_order_id: purchaseOrder!.id,
      inventory_item_id: li.inventory_item_id,
      quantity_ordered: li.quantity_approved ?? li.quantity_suggested,
      quantity_received: 0,
      unit_price: li.unit_price,
      line_total: li.line_total,
      uom: li.uom,
    }));

    const { error: poItemsError } = await req.context.supabase
      .from("purchase_order_items")
      .insert(poItems);

    if (poItemsError) {
      throwSupabaseError("Unable to create purchase order items.", poItemsError);
    }

    // Update the suggested order: mark submitted and link the purchase order
    const { error: updateError } = await req.context.supabase
      .from("suggested_orders")
      .update({
        status: "submitted",
        approved_at: now,
        submitted_at: now,
        approved_by: req.context.user?.id ?? null,
        purchase_order_id: purchaseOrder!.id,
      })
      .eq("id", id);

    if (updateError) {
      throwSupabaseError("Unable to update the suggested order.", updateError);
    }

    // Return a confirmation object — rendered on the Purchase Confirmation page
    const confirmation = {
      suggestedOrderId: id,
      purchaseOrderId: purchaseOrder!.id,
      poNumber,
      supplierRef: supplierRefNumber,
      status: "submitted" as const,
      totalAmount: Math.round(totalAmount * 100) / 100,
      currency: "USD",
      itemCount: lineItems.length,
      supplierId: order.supplier_id,
      submittedAt: now,
      estimatedDeliveryDays,
      estimatedDeliveryDate: poPayload.expected_delivery_date,
    };

    sendSuccess(req, res, confirmation);
  }),
);
