"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { createDraftPurchaseOrder } from "@/app/(app)/product-catalog/actions";
import type { DraftPurchaseOrderActionResult } from "@/app/(app)/product-catalog/action-types";
import type { Facility, ProductCatalogItem } from "@/types/contracts";
import { ProductThumbnail } from "./product-thumbnail";

interface ProductCatalogListProps {
  facilities: Facility[];
  items: ProductCatalogItem[];
  searchQuery?: string;
}

interface DraftLine {
  item: ProductCatalogItem;
  quantity: number;
}

const formatCurrency = (value: number | null, currency: string | null) =>
  value === null
    ? "Not available"
    : `${currency ?? "USD"} ${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const uniqueCount = (values: Array<string | null>) =>
  new Set(values.filter((value): value is string => Boolean(value))).size;

const SummaryCard = ({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  tone?: "default" | "success" | "source";
}) => {
  const toneClass = {
    default: "border-slate-200 text-lighthouse-primary",
    success: "border-emerald-200 text-lighthouse-accent",
    source: "border-blue-200 text-blue-700",
  }[tone];
  const testId = `product-catalog-summary-${label
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${toneClass}`}
      data-testid={testId}
    >
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-normal">{value}</p>
      <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
    </div>
  );
};

const SourceBadge = ({ item }: { item: ProductCatalogItem }) =>
  item.source_po_number ? (
    <span className="inline-flex w-fit rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
      Seen in PO {item.source_po_number}
    </span>
  ) : (
    <span className="inline-flex w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
      Purchasing catalog
    </span>
  );

const DraftOrderPanel = ({
  draftLines,
  facilities,
  selectedFacilityId,
  actionResult,
  isPending,
  onFacilityChange,
  onQuantityChange,
  onRemove,
  onCreateDraft,
}: {
  draftLines: DraftLine[];
  facilities: Facility[];
  selectedFacilityId: string;
  actionResult: DraftPurchaseOrderActionResult | null;
  isPending: boolean;
  onFacilityChange: (facilityId: string) => void;
  onQuantityChange: (
    sourcePurchaseOrderItemId: string,
    quantity: number,
  ) => void;
  onRemove: (sourcePurchaseOrderItemId: string) => void;
  onCreateDraft: () => void;
}) => {
  const selectedFacility =
    facilities.find((facility) => facility.id === selectedFacilityId) ?? null;
  const vendorIds = new Set(
    draftLines
      .map((line) => line.item.vendor_id)
      .filter((value): value is string => Boolean(value)),
  );
  const itemCount = draftLines.reduce(
    (total, line) => total + line.quantity,
    0,
  );
  const subtotal = draftLines.reduce(
    (total, line) =>
      total + (line.item.last_known_unit_price ?? 0) * line.quantity,
    0,
  );
  const supplierName = draftLines[0]?.item.supplier_name ?? "Selected supplier";
  const hasMissingPrice = draftLines.some(
    (line) => line.item.last_known_unit_price === null,
  );
  const canCreate =
    draftLines.length > 0 &&
    Boolean(selectedFacility) &&
    vendorIds.size === 1 &&
    !hasMissingPrice &&
    !isPending;

  return (
    <aside
      className="rounded-lg border border-lighthouse-primary/15 bg-white p-5 shadow-sm"
      data-testid="draft-order-panel"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
            Internal draft
          </p>
          <h2 className="mt-2 text-xl font-bold text-lighthouse-primary">
            Draft Purchase Order
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Add catalog products to prepare a VitalTrack draft. Supplier
            submission integration is not enabled in this demo environment.
          </p>
        </div>
        <div className="rounded-md bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Draft subtotal
          </p>
          <p
            className="mt-1 text-lg font-bold text-lighthouse-primary"
            data-testid="draft-order-subtotal"
          >
            {formatCurrency(subtotal, draftLines[0]?.item.currency ?? "USD")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <label
            className="font-semibold text-slate-500"
            htmlFor="draft-po-facility"
          >
            Facility
          </label>
          {facilities.length > 1 ? (
            <select
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1 font-bold text-slate-900 outline-none focus:border-lighthouse-accent focus:ring-2 focus:ring-lighthouse-accent/15"
              id="draft-po-facility"
              value={selectedFacilityId}
              onChange={(event) => onFacilityChange(event.target.value)}
            >
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 font-bold text-slate-900">
              {selectedFacility?.name ?? "No facility available"}
            </p>
          )}
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="font-semibold text-slate-500">Supplier</p>
          <p className="mt-1 font-bold text-slate-900">{supplierName}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="font-semibold text-slate-500">Items selected</p>
          <p
            className="mt-1 font-bold text-slate-900"
            data-testid="draft-order-item-count"
          >
            {itemCount}
          </p>
        </div>
      </div>

      {draftLines.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Select products from the catalog to review an internal draft PO.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
          {draftLines.map((line) => (
            <div
              key={line.item.source_purchase_order_item_id}
              className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_160px_96px]"
              data-testid="draft-order-row"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-900">
                  {line.item.product_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {line.item.vendor_item_number ?? "Item number not available"}{" "}
                  ·{" "}
                  {formatCurrency(
                    line.item.last_known_unit_price,
                    line.item.currency,
                  )}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                Qty
                <input
                  aria-label={`Quantity for ${line.item.product_name}`}
                  className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-lighthouse-accent focus:ring-2 focus:ring-lighthouse-accent/15"
                  min={1}
                  max={999}
                  type="number"
                  value={line.quantity}
                  onChange={(event) =>
                    onQuantityChange(
                      line.item.source_purchase_order_item_id,
                      Number(event.target.value),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="text-left text-sm font-bold text-slate-500 hover:text-red-700 md:text-right"
                onClick={() =>
                  onRemove(line.item.source_purchase_order_item_id)
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {vendorIds.size > 1 ? (
        <p className="mt-3 text-sm font-semibold text-amber-700">
          Review one supplier at a time before creating a draft PO.
        </p>
      ) : null}
      {hasMissingPrice ? (
        <p className="mt-3 text-sm font-semibold text-amber-700">
          Every draft line needs a source-backed unit price.
        </p>
      ) : null}

      {actionResult ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${
            actionResult.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
          data-testid="draft-order-message"
        >
          <p className="font-semibold">{actionResult.message}</p>
          {actionResult.status === "success" ? (
            <Link
              className="mt-2 inline-flex font-bold text-lighthouse-primary underline"
              href="/purchase-orders"
            >
              View Purchase Orders
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Draft POs stay inside VitalTrack until a real supplier submission
          integration is enabled.
        </p>
        <button
          type="button"
          className="rounded-md bg-lighthouse-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-lighthouse-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          data-testid="draft-order-create"
          disabled={!canCreate}
          onClick={onCreateDraft}
        >
          {isPending ? "Creating draft..." : "Create Draft PO"}
        </button>
      </div>
    </aside>
  );
};

export const ProductCatalogList = ({
  facilities,
  items,
  searchQuery = "",
}: ProductCatalogListProps) => {
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState(
    facilities[0]?.id ?? "",
  );
  const [actionResult, setActionResult] =
    useState<DraftPurchaseOrderActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const supplierCount = uniqueCount(items.map((item) => item.supplier_name));
  const sourceOrderCount = uniqueCount(
    items.map((item) => item.source_po_number),
  );
  const draftVendorId = useMemo(() => {
    const vendorIds = new Set(
      draftLines
        .map((line) => line.item.vendor_id)
        .filter((value): value is string => Boolean(value)),
    );

    return vendorIds.size === 1 ? Array.from(vendorIds)[0] : null;
  }, [draftLines]);
  const selectedFacility =
    facilities.find((facility) => facility.id === selectedFacilityId) ?? null;

  const addToDraft = (item: ProductCatalogItem) => {
    setActionResult(null);
    setDraftLines((current) => {
      const existingLine = current.find(
        (line) =>
          line.item.source_purchase_order_item_id ===
          item.source_purchase_order_item_id,
      );

      if (existingLine) {
        return current.map((line) =>
          line.item.source_purchase_order_item_id ===
          item.source_purchase_order_item_id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }

      return [...current, { item, quantity: 1 }];
    });
  };

  const setQuantity = (sourcePurchaseOrderItemId: string, quantity: number) => {
    setActionResult(null);
    const safeQuantity = Number.isFinite(quantity)
      ? Math.min(Math.max(Math.trunc(quantity), 1), 999)
      : 1;
    setDraftLines((current) =>
      current.map((line) =>
        line.item.source_purchase_order_item_id === sourcePurchaseOrderItemId
          ? { ...line, quantity: safeQuantity }
          : line,
      ),
    );
  };

  const removeFromDraft = (sourcePurchaseOrderItemId: string) => {
    setActionResult(null);
    setDraftLines((current) =>
      current.filter(
        (line) =>
          line.item.source_purchase_order_item_id !== sourcePurchaseOrderItemId,
      ),
    );
  };

  const createDraft = () => {
    if (!selectedFacility || !draftVendorId || draftLines.length === 0) {
      return;
    }

    startTransition(async () => {
      const result = await createDraftPurchaseOrder({
        facilityId: selectedFacility.id,
        vendorId: draftVendorId,
        items: draftLines.map((line) => ({
          productId: line.item.product_id,
          sourcePurchaseOrderItemId: line.item.source_purchase_order_item_id,
          quantityOrdered: line.quantity,
        })),
      });

      setActionResult(result);
      if (result.status === "success") {
        setDraftLines([]);
      }
    });
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
            Dentira product catalog
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-lighthouse-primary">
            Product Catalog
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Browse source-backed Dentira products found in verified Patterson
            Dental purchasing records. Catalog products are shown separately
            from current inventory counts.
          </p>
        </div>

        <form action="/product-catalog" className="w-full xl:max-w-md">
          <label
            htmlFor="product-catalog-search"
            className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
          >
            Search products
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="product-catalog-search"
              name="search"
              type="search"
              defaultValue={searchQuery}
              placeholder="Search product, brand, or item #"
              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-lighthouse-accent focus:ring-2 focus:ring-lighthouse-accent/15"
            />
            <button
              type="submit"
              className="rounded-md bg-lighthouse-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-lighthouse-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lighthouse-primary"
            >
              Search
            </button>
          </div>
        </form>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Products shown"
          value={items.length}
          description="Catalog rows from purchasing evidence"
          tone={items.length > 0 ? "success" : "default"}
        />
        <SummaryCard
          label="Source POs"
          value={sourceOrderCount}
          description="Verified purchase orders represented"
          tone="source"
        />
        <SummaryCard
          label="Suppliers"
          value={supplierCount}
          description="Supplier names available in the result set"
        />
      </div>

      <DraftOrderPanel
        actionResult={actionResult}
        draftLines={draftLines}
        facilities={facilities}
        isPending={isPending}
        onCreateDraft={createDraft}
        onFacilityChange={setSelectedFacilityId}
        onQuantityChange={setQuantity}
        onRemove={removeFromDraft}
        selectedFacilityId={selectedFacilityId}
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Patterson purchasing products
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Unit prices and item numbers reflect the source order evidence.
            Stock levels, par values, reorder points, and storage locations
            remain in Inventory only when real inventory records exist.
          </p>
        </div>

        {items.length === 0 ? (
          <div
            className="px-5 py-12 text-center"
            data-testid="product-catalog-empty-state"
          >
            <p className="text-base font-semibold text-slate-900">
              No catalog products found
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {searchQuery
                ? `No source-backed catalog products match "${searchQuery}".`
                : "No source-backed catalog products are currently listed for this workspace."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {items.map((item) => (
              <article
                key={`${item.product_id}-${item.source_po_number ?? "catalog"}-${item.source_line_number ?? "line"}`}
                className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[112px_minmax(0,1fr)]"
                data-testid="product-catalog-row"
              >
                <ProductThumbnail item={item} />

                <div className="min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <SourceBadge item={item} />
                      <h3 className="mt-3 text-base font-bold leading-6 text-slate-900">
                        {item.product_name}
                      </h3>
                      {item.product_description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.product_description}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 rounded-md bg-slate-50 px-3 py-2 text-left sm:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Last unit price
                      </p>
                      <p className="mt-1 text-sm font-bold text-lighthouse-primary">
                        {formatCurrency(
                          item.last_known_unit_price,
                          item.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Brand / manufacturer
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-800">
                        {item.brand_or_manufacturer ?? "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Supplier
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-800">
                        {item.supplier_name ?? "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Item number
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-800">
                        {item.vendor_item_number ?? "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Source line
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-800">
                        {item.source_line_number
                          ? `Line ${item.source_line_number}`
                          : "Not available"}
                      </dd>
                    </div>
                  </dl>

                  {item.raw_description ? (
                    <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                      Source description: {item.raw_description}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className="mt-4 rounded-md bg-lighthouse-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    data-testid="product-catalog-add-to-draft"
                    disabled={
                      !item.vendor_id || item.last_known_unit_price === null
                    }
                    onClick={() => addToDraft(item)}
                  >
                    Add to Draft
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
