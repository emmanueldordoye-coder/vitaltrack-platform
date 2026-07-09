/**
 * /catalog — Product Catalog
 *
 * Step 1 of the Lighthouse workflow. Shows all inventory items enriched with
 * current stock levels for the first available facility. Items below their
 * reorder level are flagged so staff can immediately see what needs attention.
 *
 * The "Generate Suggested Order" link takes the user to /suggested-orders
 * where they can trigger automatic order creation.
 */
import Link from "next/link";

import { createServerApiClient } from "@/lib/api/server";
import type { CatalogItem } from "@/types/contracts";

/** Map a stock_status value to a Tailwind badge style. */
function StockBadge({ status }: { status: CatalogItem["stock_status"] }) {
  const styles: Record<CatalogItem["stock_status"], string> = {
    ok: "bg-green-100 text-green-800",
    low: "bg-yellow-100 text-yellow-800",
    critical: "bg-red-100 text-red-800",
    unknown: "bg-slate-100 text-slate-600",
  };
  const labels: Record<CatalogItem["stock_status"], string> = {
    ok: "In Stock",
    low: "Low",
    critical: "Critical",
    unknown: "—",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default async function CatalogPage() {
  const api = await createServerApiClient();

  // Fetch the first available facility so we can show stock levels
  const facilities = await api.listFacilities({ limit: 1 });
  const facilityId = facilities[0]?.id;

  // Load catalog items enriched with stock data for that facility
  const items = await api.listCatalogItems({
    facilityId,
    isActive: true,
    limit: 100,
  });

  const lowStockCount = items.filter(
    (i) => i.stock_status === "low" || i.stock_status === "critical",
  ).length;

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Product Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {facilityId
              ? `Showing stock levels for ${facilities[0]?.name ?? "your facility"}.`
              : "Connect a facility to see live stock levels."}
          </p>
        </div>

        {lowStockCount > 0 && (
          <Link
            href="/suggested-orders"
            className="flex-shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Generate Suggested Order ({lowStockCount} low)
          </Link>
        )}
      </header>

      {/* Low-stock call-out banner */}
      {lowStockCount > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <strong>{lowStockCount} item{lowStockCount !== 1 ? "s are" : " is"} below reorder level.</strong>{" "}
          Review the items below and generate a suggested order when ready.
        </div>
      )}

      {/* Catalog table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3 text-right">On Hand</th>
              <th className="px-4 py-3 text-right">Reorder At</th>
              <th className="px-4 py-3 text-right">Unit Cost</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No catalog items found. Run the dental supplies seed to get started.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr
                key={item.id}
                className={
                  item.stock_status === "critical"
                    ? "bg-red-50"
                    : item.stock_status === "low"
                      ? "bg-yellow-50"
                      : undefined
                }
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {item.sku}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.subcategory ?? item.category ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {/* supplier is a nested object from the backend join */}
                  {(item.supplier as { name: string } | null)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {item.stock_level?.available_quantity ?? "—"}{" "}
                  <span className="text-xs text-slate-500">{item.uom ?? ""}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {item.stock_level?.reorder_level ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {item.unit_cost != null
                    ? `$${item.unit_cost.toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <StockBadge status={item.stock_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
