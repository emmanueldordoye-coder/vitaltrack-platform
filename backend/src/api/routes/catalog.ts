/**
 * GET /api/v1/catalog
 *
 * Returns inventory items enriched with current stock-level data for a facility.
 * This is the starting point of the Lighthouse procurement workflow:
 *   Catalog → Low Stock Detection → Suggested Order → Review → Approve → Confirmation
 */
import { Router } from "express";
import { z } from "zod";

import { sanitizeLikePatternTerm } from "../filters.js";
import { handleRoute } from "../route-handler.js";
import { sendSuccess } from "../response.js";
import { validate } from "../middleware/validate.js";
import { listCatalogQuerySchema } from "../schemas/suggested-orders.js";
import { throwSupabaseError } from "../supabase-errors.js";

type CatalogQuery = z.infer<typeof listCatalogQuerySchema>;

export const catalogRouter = Router();

catalogRouter.get(
  "/",
  validate({ query: listCatalogQuerySchema }),
  handleRoute(async (req, res) => {
    const { facilityId, search, category, isActive, limit } =
      req.context.validated?.query as CatalogQuery;

    // Fetch inventory items (org-scoped automatically via Supabase RLS)
    let itemQuery = req.context.supabase
      .from("inventory_items")
      .select("*, supplier:suppliers(id, name)")
      .order("category", { ascending: true })
      .order("name", { ascending: true })
      .limit(limit);

    if (category) {
      itemQuery = itemQuery.eq("category", category);
    }
    if (isActive !== undefined) {
      itemQuery = itemQuery.eq("is_active", isActive);
    }
    if (search) {
      const term = sanitizeLikePatternTerm(search);
      if (term) {
        itemQuery = itemQuery.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
      }
    }

    const { data: items, error: itemsError } = await itemQuery;
    if (itemsError) {
      throwSupabaseError("Unable to load catalog items.", itemsError);
    }

    const catalogItems = items ?? [];

    // If a facility is provided, enrich each item with its current stock level
    if (facilityId && catalogItems.length > 0) {
      const itemIds = catalogItems.map((i) => i.id);

      const { data: stockLevels, error: stockError } = await req.context.supabase
        .from("stock_levels")
        .select("inventory_item_id, available_quantity, reorder_level, min_level, max_level, reorder_quantity")
        .eq("facility_id", facilityId)
        .in("inventory_item_id", itemIds);

      if (stockError) {
        throwSupabaseError("Unable to load stock levels.", stockError);
      }

      // Build a lookup map for O(1) access per item
      const stockByItemId = new Map(
        (stockLevels ?? []).map((sl) => [sl.inventory_item_id, sl]),
      );

      // Merge and compute stock_status badge
      const enriched = catalogItems.map((item) => {
        const sl = stockByItemId.get(item.id);

        let stockStatus: "ok" | "low" | "critical" | "unknown" = "unknown";
        if (sl) {
          const qty = sl.available_quantity ?? 0;
          const reorderLevel = sl.reorder_level ?? 0;
          const minLevel = sl.min_level ?? 0;

          if (qty <= minLevel) {
            stockStatus = "critical";
          } else if (qty <= reorderLevel) {
            stockStatus = "low";
          } else {
            stockStatus = "ok";
          }
        }

        return {
          ...item,
          stock_level: sl ?? null,
          stock_status: stockStatus,
        };
      });

      return sendSuccess(req, res, enriched);
    }

    // No facility — return items without stock data
    const withStatus = catalogItems.map((item) => ({
      ...item,
      stock_level: null,
      stock_status: "unknown" as const,
    }));

    sendSuccess(req, res, withStatus);
  }),
);
