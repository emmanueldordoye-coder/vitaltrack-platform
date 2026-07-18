import { createServerApiClient } from "@/lib/api/server";

export default async function InventoryPage() {
  const apiClient = await createServerApiClient();
  const items = await apiClient.listInventoryItems({ limit: 50 });

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track Product Catalog quantities, reorder points, and supplier
          context.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">MPN</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Par</th>
              <th className="px-4 py-3 text-right font-medium">Reorder</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 text-right font-medium">Unit cost</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500"
                  colSpan={10}
                >
                  No Lighthouse inventory levels found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={`${item.product_id}-${item.location_id}`}
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-3">{item.sku}</td>
                  <td className="px-4 py-3">{item.product_name}</td>
                  <td className="px-4 py-3">
                    {item.manufacturer_part_number ?? "—"}
                  </td>
                  <td className="px-4 py-3">{item.location_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {item.current_quantity}
                  </td>
                  <td className="px-4 py-3 text-right">{item.par_level}</td>
                  <td className="px-4 py-3 text-right">{item.reorder_point}</td>
                  <td className="px-4 py-3">{item.vendor_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {item.unit_cost === null
                      ? "—"
                      : `USD ${item.unit_cost.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    {item.is_low_stock ? (
                      <span className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        Low stock
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        In stock
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
