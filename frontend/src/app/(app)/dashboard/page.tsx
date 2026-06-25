import { StatCard } from "@/components/dashboard/stat-card";
import { createServerApiClient } from "@/lib/api/server";

export default async function DashboardPage() {
  const apiClient = await createServerApiClient();
  const [facilities, inventoryItems, purchaseOrders] = await Promise.all([
    apiClient.listFacilities({ limit: 10 }),
    apiClient.listInventoryItems({ limit: 10 }),
    apiClient.listPurchaseOrders({ limit: 10 }),
  ]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Operations snapshot pulled from the backend API.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Facilities" value={facilities.length} />
        <StatCard label="Inventory items" value={inventoryItems.length} />
        <StatCard label="Purchase orders" value={purchaseOrders.length} />
      </div>
    </section>
  );
}
