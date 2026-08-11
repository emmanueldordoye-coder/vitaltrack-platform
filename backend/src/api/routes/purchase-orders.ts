import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Router } from "express";
import { z } from "zod";

import type {
  Database,
  Json,
  TableInsert,
  TableRow,
} from "../../types/database.js";
import { AppError, createNotFoundError } from "../errors.js";
import {
  mapPurchaseOrder,
  type PurchaseOrderRecord,
} from "../mappers/purchase-orders.js";
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
type PurchaseOrderItemInsert = TableInsert<"purchase_order_items">;

type CatalogSourceRecord = TableRow<"purchase_order_items"> & {
  products?:
    | {
        id: string;
        sku: string;
        name: string;
        description: string | null;
        brand_name: string | null;
        metadata: Json | null;
        manufacturers?:
          { id: string; name: string } | { id: string; name: string }[] | null;
      }
    | {
        id: string;
        sku: string;
        name: string;
        description: string | null;
        brand_name: string | null;
        metadata: Json | null;
        manufacturers?:
          { id: string; name: string } | { id: string; name: string }[] | null;
      }[]
    | null;
  purchase_orders?:
    | {
        id: string;
        po_number: string;
        currency: string | null;
        vendor_id: string | null;
        organization_id: string | null;
        metadata: Json | null;
        vendors?:
          | { id: string; name: string; vendor_code: string | null }
          | { id: string; name: string; vendor_code: string | null }[]
          | null;
      }
    | {
        id: string;
        po_number: string;
        currency: string | null;
        vendor_id: string | null;
        organization_id: string | null;
        metadata: Json | null;
        vendors?:
          | { id: string; name: string; vendor_code: string | null }
          | { id: string; name: string; vendor_code: string | null }[]
          | null;
      }[]
    | null;
};

const DRAFT_SUPPLIER_SUBMISSION_MESSAGE =
  "Draft PO created in VitalTrack. Supplier submission integration is not enabled in this demo environment.";

const firstRelated = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;

const metadataRecord = (metadata: Json | null | undefined) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, Json | undefined>;
};

const metadataString = (metadata: Json | null | undefined, key: string) => {
  const value = metadataRecord(metadata)[key];
  return typeof value === "string" && value.trim() ? value : null;
};

const metadataNumber = (metadata: Json | null | undefined, key: string) => {
  const value = metadataRecord(metadata)[key];
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const coerceNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const createBadRequestError = (message: string, details?: unknown) =>
  new AppError({
    statusCode: 400,
    code: "BAD_REQUEST",
    message,
    details,
  });

const generateDraftPoNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `VT-DRAFT-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

const listOwnedFacilityIds = async (
  reqSupabase: SupabaseClient<Database>,
  organizationId: string,
) => {
  const { data, error } = await reqSupabase
    .from("facilities")
    .select("id")
    .eq("organization_id", organizationId);

  if (error) {
    throwSupabaseError("Unable to load facilities for purchase orders.", error);
  }

  return (data ?? []).map((facility) => facility.id);
};

const buildLegacyPurchaseOrderTenantFilter = async (
  reqSupabase: SupabaseClient<Database>,
  organizationId: string,
) => {
  const ownedFacilityIds = await listOwnedFacilityIds(
    reqSupabase,
    organizationId,
  );

  if (ownedFacilityIds.length === 0) {
    return null;
  }

  return `organization_id.eq.${organizationId},and(organization_id.is.null,facility_id.in.(${ownedFacilityIds.join(",")}))`;
};

const assertFacilityBelongsToOrganization = async (
  reqSupabase: SupabaseClient<Database>,
  facilityId: string,
  organizationId: string,
) => {
  const { data, error } = await reqSupabase
    .from("facilities")
    .select("id")
    .eq("id", facilityId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throwSupabaseError(
      "Unable to validate the purchase order facility.",
      error,
    );
  }

  if (!data) {
    throw createNotFoundError("Facility");
  }
};

const assertVendorBelongsToOrganization = async (
  reqSupabase: SupabaseClient<Database>,
  vendorId: string,
  organizationId: string,
) => {
  const { data, error } = await reqSupabase
    .from("vendors")
    .select("id, name, vendor_code")
    .eq("id", vendorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throwSupabaseError("Unable to validate the purchase order vendor.", error);
  }

  if (!data) {
    throw createNotFoundError("Vendor");
  }

  return data;
};

const aggregateDraftItems = (
  items: NonNullable<CreatePurchaseOrderInput["items"]>,
) => {
  const quantitiesBySourceLine = new Map<
    string,
    {
      productId: string;
      sourcePurchaseOrderItemId: string;
      quantityOrdered: number;
    }
  >();

  for (const item of items) {
    const existingLine = quantitiesBySourceLine.get(
      item.sourcePurchaseOrderItemId,
    );
    quantitiesBySourceLine.set(item.sourcePurchaseOrderItemId, {
      productId: item.productId,
      sourcePurchaseOrderItemId: item.sourcePurchaseOrderItemId,
      quantityOrdered:
        (existingLine?.quantityOrdered ?? 0) + item.quantityOrdered,
    });
  }

  return Array.from(quantitiesBySourceLine.values());
};

const resolveCatalogDraftItems = async ({
  reqSupabase,
  organizationId,
  vendorId,
  items,
}: {
  reqSupabase: SupabaseClient<Database>;
  organizationId: string;
  vendorId: string;
  items: NonNullable<CreatePurchaseOrderInput["items"]>;
}) => {
  const draftItems = aggregateDraftItems(items);
  const sourceLineIds = draftItems.map(
    (item) => item.sourcePurchaseOrderItemId,
  );

  const { data, error } = await reqSupabase
    .from("purchase_order_items")
    .select(
      `
        *,
        products!inner (
          id,
          sku,
          name,
          description,
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
          currency,
          vendor_id,
          organization_id,
          metadata,
          vendors (
            id,
            name,
            vendor_code
          )
        )
      `,
    )
    .eq("organization_id", organizationId)
    .eq("products.organization_id", organizationId)
    .eq("purchase_orders.organization_id", organizationId)
    .eq("purchase_orders.vendor_id", vendorId)
    .in("id", sourceLineIds)
    .is("deleted_at", null);

  if (error) {
    throwSupabaseError(
      "Unable to validate catalog products for draft PO.",
      error,
    );
  }

  const sourceByLineId = new Map<string, CatalogSourceRecord>();
  for (const record of (data ?? []) as CatalogSourceRecord[]) {
    if (!sourceByLineId.has(record.id)) {
      sourceByLineId.set(record.id, record);
    }
  }

  const missingSourceLineIds = sourceLineIds.filter(
    (sourceLineId) => !sourceByLineId.has(sourceLineId),
  );
  if (missingSourceLineIds.length > 0) {
    throw createBadRequestError(
      "Draft PO contains catalog products that are not available for this supplier and workspace.",
      { sourcePurchaseOrderItemIds: missingSourceLineIds },
    );
  }

  const inserts: PurchaseOrderItemInsert[] = [];
  let totalAmount = 0;
  let currency: string | null = null;

  for (const item of draftItems) {
    const source = sourceByLineId.get(item.sourcePurchaseOrderItemId)!;
    const product = firstRelated(source.products);
    const manufacturer = firstRelated(product?.manufacturers);
    const sourceOrder = firstRelated(source.purchase_orders);
    const unitPrice = coerceNumber(source.unit_price);

    if (source.product_id === null || source.product_id !== item.productId) {
      throw createBadRequestError(
        "Draft PO contains an invalid catalog product mapping.",
      );
    }

    if (product?.id !== item.productId) {
      throw createBadRequestError(
        "Draft PO contains a product that does not match the selected source line.",
      );
    }

    if (!sourceOrder || sourceOrder.vendor_id !== vendorId) {
      throw createBadRequestError(
        "Draft PO contains a product from a different supplier.",
      );
    }

    if (unitPrice === null) {
      throw createBadRequestError(
        "Draft PO products must have a source-backed unit price.",
        { productId: item.productId },
      );
    }

    const sourceCurrency = (sourceOrder.currency ?? "USD").toUpperCase();
    if (currency !== null && currency !== sourceCurrency) {
      throw createBadRequestError(
        "Draft PO products must use a single source-backed currency.",
      );
    }
    currency = sourceCurrency;

    const lineTotal = roundCurrency(item.quantityOrdered * unitPrice);
    totalAmount = roundCurrency(totalAmount + lineTotal);

    inserts.push({
      purchase_order_id: "",
      inventory_item_id: null,
      organization_id: organizationId,
      product_id: item.productId,
      suggested_order_item_id: null,
      quantity_ordered: item.quantityOrdered,
      quantity_received: 0,
      unit_price: unitPrice,
      line_total: lineTotal,
      uom: source.uom ?? "order-unit",
      notes:
        source.notes ??
        product?.description ??
        metadataString(source.metadata, "raw_product_description"),
      status: "open",
      metadata: {
        source: "product_catalog_draft",
        source_purchase_order_item_id: source.id,
        source_po_number: sourceOrder.po_number,
        source_line_number: metadataNumber(
          source.metadata,
          "source_line_number",
        ),
        raw_product_description:
          metadataString(source.metadata, "raw_product_description") ??
          product?.description ??
          product?.name ??
          null,
        normalized_product_name:
          product?.name ??
          metadataString(source.metadata, "normalized_product_name"),
        brand_or_manufacturer:
          product?.brand_name ??
          manufacturer?.name ??
          metadataString(source.metadata, "brand_or_manufacturer"),
        vendor_item_number:
          metadataString(source.metadata, "vendor_item_number") ??
          metadataString(product?.metadata, "vendor_item_number"),
        image_source:
          metadataString(source.metadata, "image_source") ??
          metadataString(product?.metadata, "image_source"),
        image_source_page:
          metadataString(source.metadata, "image_source_page") ??
          metadataString(product?.metadata, "image_source_page"),
      },
    });
  }

  return {
    currency: currency ?? "USD",
    totalAmount,
    items: inserts,
  };
};

const rollbackCreatedDraftOrder = async (
  reqSupabase: SupabaseClient<Database>,
  purchaseOrderId: string,
  organizationId: string,
) => {
  const { error } = await reqSupabase
    .from("purchase_orders")
    .delete()
    .eq("id", purchaseOrderId)
    .eq("organization_id", organizationId);

  if (error) {
    throwSupabaseError("Unable to roll back incomplete draft PO.", error);
  }
};

const attachItems = async (
  reqSupabase: SupabaseClient<Database>,
  purchaseOrder: PurchaseOrderRow,
) => {
  const { data: items, error } = await reqSupabase
    .from("purchase_order_items")
    .select(
      `
        *,
        products (
          id,
          sku,
          name,
          brand_name,
          metadata,
          manufacturers (
            id,
            name
          )
        )
      `,
    )
    .eq("purchase_order_id", purchaseOrder.id)
    .order("id", { ascending: true });

  if (error) {
    throwSupabaseError("Unable to load purchase order items.", error);
  }

  return mapPurchaseOrder({
    ...(purchaseOrder as PurchaseOrderRecord),
    purchase_order_items: items ?? [],
  });
};

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get(
  "/",
  validate({ query: listPurchaseOrdersQuerySchema }),
  handleRoute(async (req, res) => {
    const { facilityId, limit, status, supplierId } = req.context.validated
      ?.query as PurchaseOrdersQuery;

    let query = req.context.supabase
      .from("purchase_orders")
      .select(
        `
          *,
          suppliers (
            id,
            name,
            supplier_code
          ),
          vendors (
            id,
            name,
            vendor_code
          ),
          purchase_order_items (
            *,
            products (
              id,
              sku,
              name,
              brand_name,
              metadata,
              manufacturers (
                id,
                name
              )
            )
          )
        `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    const legacyTenantFilter = await buildLegacyPurchaseOrderTenantFilter(
      req.context.supabase,
      req.context.organizationId!,
    );
    query = legacyTenantFilter
      ? query.or(legacyTenantFilter)
      : query.eq("organization_id", req.context.organizationId!);

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

    sendSuccess(
      req,
      res,
      ((data ?? []) as PurchaseOrderRecord[]).map(mapPurchaseOrder),
    );
  }),
);

purchaseOrdersRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  handleRoute(async (req, res) => {
    const { id } = req.context.validated?.params as z.infer<
      typeof idParamSchema
    >;

    let query = req.context.supabase
      .from("purchase_orders")
      .select(
        `
          *,
          suppliers (
            id,
            name,
            supplier_code
          ),
          vendors (
            id,
            name,
            vendor_code
          )
        `,
      )
      .eq("id", id)
      .is("deleted_at", null);

    const legacyTenantFilter = await buildLegacyPurchaseOrderTenantFilter(
      req.context.supabase,
      req.context.organizationId!,
    );
    query = legacyTenantFilter
      ? query.or(legacyTenantFilter)
      : query.eq("organization_id", req.context.organizationId!);

    const { data, error } = await query.maybeSingle();

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
    const organizationId = req.context.organizationId!;
    const draftItems = body.items ?? [];
    const isCatalogDraft = draftItems.length > 0;

    await assertFacilityBelongsToOrganization(
      req.context.supabase,
      body.facilityId,
      organizationId,
    );

    const catalogDraft = isCatalogDraft
      ? await (async () => {
          await assertVendorBelongsToOrganization(
            req.context.supabase,
            body.vendorId!,
            organizationId,
          );

          return resolveCatalogDraftItems({
            reqSupabase: req.context.supabase,
            organizationId,
            vendorId: body.vendorId!,
            items: draftItems,
          });
        })()
      : null;

    const purchaseOrderPayload: TableInsert<"purchase_orders"> = {
      facility_id: body.facilityId,
      supplier_id: body.supplierId ?? null,
      vendor_id: body.vendorId ?? null,
      organization_id: organizationId,
      po_number: isCatalogDraft ? generateDraftPoNumber() : body.poNumber!,
      po_date: isCatalogDraft ? new Date().toISOString() : body.poDate!,
      expected_delivery_date: body.expectedDeliveryDate ?? null,
      actual_delivery_date: body.actualDeliveryDate ?? null,
      status: isCatalogDraft ? "draft" : body.status,
      total_amount: catalogDraft?.totalAmount ?? body.totalAmount ?? null,
      currency: (catalogDraft?.currency ?? body.currency).toUpperCase(),
      mock_supplier_submission: false,
      notes: body.notes ?? null,
      metadata: isCatalogDraft
        ? {
            source: "product_catalog_draft",
            supplier_submission_enabled: false,
            supplier_submission_message: DRAFT_SUPPLIER_SUBMISSION_MESSAGE,
          }
        : {},
      created_by: req.context.user?.id ?? null,
      updated_by: req.context.user?.id ?? null,
    };

    const { data: createdOrder, error: purchaseOrderError } =
      await req.context.supabase
        .from("purchase_orders")
        .insert(purchaseOrderPayload)
        .select("*")
        .single();

    if (purchaseOrderError) {
      throwSupabaseError(
        "Unable to create the purchase order.",
        purchaseOrderError,
      );
    }

    if (!createdOrder) {
      throwSupabaseError("Unable to create the purchase order.", {
        message: "Purchase order insert returned no row.",
      });
    }

    const createdPurchaseOrder = createdOrder as PurchaseOrderRow;

    if (!catalogDraft) {
      sendSuccess(req, res, createdPurchaseOrder, 201);
      return;
    }

    const itemPayload = catalogDraft.items.map((item) => ({
      ...item,
      purchase_order_id: createdPurchaseOrder.id,
    }));

    const { error: purchaseOrderItemsError } = await req.context.supabase
      .from("purchase_order_items")
      .insert(itemPayload);

    if (purchaseOrderItemsError) {
      await rollbackCreatedDraftOrder(
        req.context.supabase,
        createdPurchaseOrder.id,
        organizationId,
      );
      throwSupabaseError(
        "Unable to create the draft purchase order items.",
        purchaseOrderItemsError,
      );
    }

    sendSuccess(
      req,
      res,
      await attachItems(req.context.supabase, createdPurchaseOrder),
      201,
    );
  }),
);
