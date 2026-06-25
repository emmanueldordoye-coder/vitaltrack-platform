import { createServerApiClient } from "@/lib/api/server";

export default async function PurchaseOrdersPage() {
  const apiClient = await createServerApiClient();
  const purchaseOrders = await apiClient.listPurchaseOrders({ limit: 50 });

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Purchase Orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review issued orders and delivery status from the backend service.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">PO Number</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{order.po_number}</td>
                <td className="px-4 py-3">{order.status ?? "—"}</td>
                <td className="px-4 py-3">
                  {order.total_amount === null || order.total_amount === undefined
                    ? "—"
                    : `${order.currency ?? "USD"} ${order.total_amount.toFixed(2)}`}
                </td>
                <td className="px-4 py-3">{order.po_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
