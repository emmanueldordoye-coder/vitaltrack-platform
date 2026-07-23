import { Router } from "express";
import { z } from "zod";

import { createNotFoundError } from "../errors.js";
import { sanitizeLikePatternTerm } from "../filters.js";
import { handleRoute } from "../route-handler.js";
import { sendSuccess } from "../response.js";
import { validate } from "../middleware/validate.js";
import {
  mapLighthouseInventoryItems,
  type LighthouseInventoryLevelRecord,
  type LighthouseVendorRecord,
} from "../mappers/lighthouse-inventory.js";
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
    const { isActive, limit, search } = req.context.validated
      ?.query as InventoryQuery;

    let query = req.context.supabase
      .from("inventory_levels")
      .select(
        `
          product_id,
          current_quantity,
          par_level,
          reorder_point,
          location_id,
          products!inner (
            id,
            sku,
            name,
            manufacturer_part_number,
            metadata
          ),
          locations!inner (
            id,
            name
          ),
          facilities!inner (
            organization_id
          )
        `,
      )
      .eq("organization_id", req.context.organizationId!)
      .eq("facilities.organization_id", req.context.organizationId!)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (isActive !== undefined) {
      query = query.eq("products.is_active", isActive);
    }

    if (search) {
      const sanitizedSearch = sanitizeLikePatternTerm(search);

      if (sanitizedSearch) {
        query = query.or(
          `name.ilike.%${sanitizedSearch}%,sku.ilike.%${sanitizedSearch}%,manufacturer_part_number.ilike.%${sanitizedSearch}%`,
          { foreignTable: "products" },
        );
      }
    }

    const { data, error } = (await query) as {
      data: LighthouseInventoryLevelRecord[] | null;
      error: { code?: string; message: string } | null;
    };

    if (error) {
      throwSupabaseError("Unable to list Lighthouse inventory.", error);
    }

    const { data: vendors, error: vendorsError } = (await req.context.supabase
      .from("vendors")
      .select("id, name, vendor_code")
      .eq("organization_id", req.context.organizationId!)
      .eq("is_active", true)) as {
      data: LighthouseVendorRecord[] | null;
      error: { code?: string; message: string } | null;
    };

    if (vendorsError) {
      throwSupabaseError("Unable to list Lighthouse vendors.", vendorsError);
    }

    sendSuccess(
      req,
      res,
      mapLighthouseInventoryItems(data ?? [], vendors ?? []),
    );
  }),
);

inventoryRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  handleRoute(async (req, res) => {
    const { id } = req.context.validated?.params as z.infer<
      typeof idParamSchema
    >;

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
