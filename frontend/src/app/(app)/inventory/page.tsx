import { createServerApiClient } from "@/lib/api/server";

import { createInventoryItemAction, initialInventoryFormState } from "./actions";
import { InventoryForm } from "./inventory-form";

export default async function InventoryPage() {
  const apiClient = await createServerApiClient();
  const items = await apiClient.listInventoryItems({ limit: 50 });

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track stock SKUs, categories, and base procurement metadata.
        </p>
      </header>

      <InventoryForm action={createInventoryItemAction} initialState={initialInventoryFormState} />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">UOM</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{item.sku}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.category ?? "—"}</td>
                <td className="px-4 py-3">{item.uom ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
