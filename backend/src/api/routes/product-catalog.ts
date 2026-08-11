import { Router } from "express";
import { z } from "zod";

import {
  mapProductCatalogItem,
  type ProductCatalogRecord,
} from "../mappers/product-catalog.js";
import { validate } from "../middleware/validate.js";
import { handleRoute } from "../route-handler.js";
import { sendSuccess } from "../response.js";
import { listProductCatalogQuerySchema } from "../schemas/product-catalog.js";
import { throwSupabaseError } from "../supabase-errors.js";

type ProductCatalogQuery = z.infer<typeof listProductCatalogQuerySchema>;

export const productCatalogRouter = Router();

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const matchesSearch = (
  item: ReturnType<typeof mapProductCatalogItem>,
  search: string,
) => {
  const haystack = [
    item.product_name,
    item.raw_description,
    item.brand_or_manufacturer,
    item.supplier_name,
    item.vendor_item_number,
    item.sku,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
};

productCatalogRouter.get(
  "/",
  validate({ query: listProductCatalogQuerySchema }),
  handleRoute(async (req, res) => {
    const { limit, search } = req.context.validated
      ?.query as ProductCatalogQuery;

    const { data, error } = (await req.context.supabase
      .from("purchase_order_items")
      .select(
        `
          *,
          products!inner (
            id,
            sku,
            name,
            description,
            manufacturer_part_number,
            brand_name,
            metadata,
            manufacturers (
              id,
              name
            )
          ),
          purchase_orders!inner (
            id,
            po_number,
            po_date,
            confirmation_number,
            currency,
            metadata,
            vendors (
              id,
              name,
              vendor_code
            )
          )
        `,
      )
      .eq("organization_id", req.context.organizationId!)
      .eq("products.organization_id", req.context.organizationId!)
      .eq("purchase_orders.organization_id", req.context.organizationId!)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit)) as {
      data: ProductCatalogRecord[] | null;
      error: { code?: string; message: string } | null;
    };

    if (error) {
      throwSupabaseError("Unable to list Dentira product catalog.", error);
    }

    const mapped = (data ?? [])
      .map(mapProductCatalogItem)
      .filter((item) => item.product_id && item.product_name)
      .sort(
        (left, right) =>
          (left.source_line_number ?? Number.MAX_SAFE_INTEGER) -
          (right.source_line_number ?? Number.MAX_SAFE_INTEGER),
      );

    const searchTerm = search ? normalizeSearch(search) : "";
    const filtered = searchTerm
      ? mapped.filter((item) => matchesSearch(item, searchTerm))
      : mapped;

    sendSuccess(req, res, filtered);
  }),
);
