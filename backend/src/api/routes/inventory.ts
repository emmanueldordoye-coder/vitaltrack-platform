import { Router } from "express";
import { z } from "zod";

import { createNotFoundError } from "../errors.js";
import { sanitizeLikePatternTerm } from "../filters.js";
import { handleRoute } from "../route-handler.js";
import { sendSuccess } from "../response.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/common.js";
import {
  createInventoryItemSchema,
  listInventoryItemsQuerySchema,
} from "../schemas/inventory.js";
import { throwSupabaseError } from "../supabase-errors.js";
import type { TableInsert } from "../../types/database.js";

type InventoryQuery = z.infer<typeof listInventoryItemsQuerySchema>;
type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const inventoryRouter = Router();

inventoryRouter.get(
  "/",
  validate({ query: listInventoryItemsQuerySchema }),
  handleRoute(async (req, res) => {
    const { category, isActive, limit, search } =
      req.context.validated?.query as InventoryQuery;

    let query = req.context.supabase
      .from("inventory_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("category", category);
    }

    if (isActive !== undefined) {
      query = query.eq("is_active", isActive);
    }

    if (search) {
      const sanitizedSearch = sanitizeLikePatternTerm(search);

      if (sanitizedSearch) {
        query = query.or(`name.ilike.%${sanitizedSearch}%,sku.ilike.%${sanitizedSearch}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      throwSupabaseError("Unable to list inventory items.", error);
    }

    sendSuccess(req, res, data ?? []);
  }),
);

inventoryRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  handleRoute(async (req, res) => {
    const { id } = req.context.validated?.params as z.infer<typeof idParamSchema>;

    const { data, error } = await req.context.supabase
      .from("inventory_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throwSupabaseError("Unable to load the inventory item.", error);
    }

    if (!data) {
      throw createNotFoundError("Inventory item");
    }

    sendSuccess(req, res, data);
  }),
);

inventoryRouter.post(
  "/",
  validate({ body: createInventoryItemSchema }),
  handleRoute(async (req, res) => {
    const body = req.context.validated?.body as CreateInventoryItemInput;

    const payload: TableInsert<"inventory_items"> = {
      organization_id: req.context.organizationId!,
      sku: body.sku,
      name: body.name,
      category: body.category ?? null,
      subcategory: body.subcategory ?? null,
      description: body.description ?? null,
      uom: body.uom,
      unit_cost: body.unitCost ?? null,
      currency: body.currency.toUpperCase(),
      supplier_id: body.supplierId ?? null,
      manufacturer: body.manufacturer ?? null,
      model_number: body.modelNumber ?? null,
      track_expiration: body.trackExpiration,
      expiration_alert_days: body.expirationAlertDays,
      is_active: body.isActive,
      image_url: body.imageUrl ?? null,
      notes: body.notes ?? null,
      metadata: body.metadata ?? {},
    };

    const { data, error } = await req.context.supabase
      .from("inventory_items")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throwSupabaseError("Unable to create the inventory item.", error);
    }

    sendSuccess(req, res, data, 201);
  }),
);
