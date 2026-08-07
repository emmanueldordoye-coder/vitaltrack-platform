import { StatCard } from "@/components/dashboard/stat-card";
import type {
  Facility,
  InventoryCatalogItem,
  PurchaseOrder,
} from "@/types/contracts";

interface DashboardOverviewProps {
  facilities: Facility[];
  inventoryItems: InventoryCatalogItem[];
  purchaseOrders: PurchaseOrder[];
}

export const DashboardOverview = ({
  facilities,
  inventoryItems,
  purchaseOrders,
}: DashboardOverviewProps) => {
  const lowStockCount = inventoryItems.filter((item) => item.is_low_stock).length;
  const lowStockNoun = lowStockCount === 1 ? "product is" : "products are";
  const workspaceName = facilities[0]?.name ?? "Dentira workspace";
  const facilityDescription =
    facilities.length === 1
      ? workspaceName
      : `${facilities.length} active locations`;

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
            Dentira supply workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-lighthouse-primary">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Live operating snapshot for {workspaceName}, focused on facilities,
            inventory levels, low-stock items, and purchase orders.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <p className="font-semibold text-slate-900">{workspaceName}</p>
          <p className="text-xs text-slate-500">Authenticated workspace</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Facilities"
          value={facilities.length}
          description={facilityDescription}
          tone="success"
        />
        <StatCard
          label="Inventory rows"
          value={inventoryItems.length}
          description="Tracked supply rows for this workspace"
        />
        <StatCard
          label="Low-stock items"
          value={lowStockCount}
          description={
            lowStockCount === 0
              ? "No products are at or below reorder point"
              : `${lowStockCount} ${lowStockNoun} at or below reorder point`
          }
          tone={lowStockCount > 0 ? "attention" : "success"}
        />
        <StatCard
          label="Purchase orders"
          value={purchaseOrders.length}
          description={
            purchaseOrders.length === 0
              ? "No purchase orders are currently listed"
              : "Orders currently listed for this workspace"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Inventory Attention
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Low-stock status is calculated from current quantity and reorder
                point.
              </p>
            </div>
            <span
              className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-bold ${
                lowStockCount > 0
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {lowStockCount > 0 ? "Review needed" : "In range"}
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Reorder
                  </th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.slice(0, 4).map((item) => (
                  <tr
                    key={`${item.product_id}-${item.location_id}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {item.current_quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {item.reorder_point}
                    </td>
                    <td className="px-4 py-3">
                      {item.is_low_stock ? (
                        <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                          Low stock
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          In stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Workspace Context
          </h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">Facility</dt>
              <dd className="mt-1 font-semibold text-lighthouse-primary">
                {workspaceName}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Inventory view</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                Dentira supply catalog
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ordering status</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {purchaseOrders.length === 0
                  ? "No purchase orders listed"
                  : `${purchaseOrders.length} purchase orders listed`}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
};
