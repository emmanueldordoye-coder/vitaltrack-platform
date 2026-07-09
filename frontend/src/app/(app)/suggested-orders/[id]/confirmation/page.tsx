/**
 * /suggested-orders/[id]/confirmation — Purchase Confirmation
 *
 * Step 6 (final) of the Lighthouse workflow. Shown after the suggested order
 * has been approved and mock-submitted to the supplier. Displays the PO number,
 * supplier reference, and a summary of what was ordered.
 *
 * The approved suggested_order now has a linked purchase_order_id.
 * We fetch the suggested order to show the confirmation details.
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerApiClient } from "@/lib/api/server";
import { ApiClientError } from "@/lib/api/client";

export default async function PurchaseConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const api = await createServerApiClient();

  let order;
  try {
    order = await api.getSuggestedOrder(params.id);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  // Only submitted orders have a confirmation to show
  if (order.status !== "submitted") {
    notFound();
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      {/* Success banner */}
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center shadow-sm">
        <div className="mb-3 text-4xl">✅</div>
        <h1 className="text-2xl font-bold text-green-900">Order Submitted!</h1>
        <p className="mt-2 text-sm text-green-700">
          Your order has been sent to{" "}
          <strong>{order.supplier?.name ?? "your supplier"}</strong>. You will
          receive a delivery within the estimated window below.
        </p>
      </div>

      {/* Confirmation details card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Order Details
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="text-slate-500">Suggested Order ID</dt>
            <dd className="font-mono text-xs text-slate-700 break-all">{order.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Submitted to Supplier
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Supplier</dt>
            <dd className="font-medium text-slate-900">
              {order.supplier?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Submitted</dt>
            <dd className="text-slate-700">
              {order.submitted_at
                ? new Date(order.submitted_at).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Estimated Delivery</dt>
            <dd className="font-medium text-slate-900">
              3 business days
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Est. Total</dt>
            <dd className="text-lg font-bold text-slate-900">
              {order.total_estimated_cost != null
                ? `$${order.total_estimated_cost.toFixed(2)}`
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Items summary */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Items Ordered ({order.items.length})
          </h2>
        </div>
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3">UOM</th>
              <th className="px-4 py-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-slate-800">
                  {item.inventory_item?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {item.quantity_approved ?? item.quantity_suggested}
                </td>
                <td className="px-4 py-3 text-slate-500">{item.uom ?? "—"}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  {item.line_total != null
                    ? `$${item.line_total.toFixed(2)}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next steps */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm">
        <p className="text-slate-600">
          When the delivery arrives, mark items as received in Purchase Orders.
        </p>
        <div className="flex gap-3">
          <Link
            href="/catalog"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            Back to Catalog
          </Link>
          <Link
            href="/suggested-orders"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
          >
            All Orders
          </Link>
        </div>
      </div>
    </section>
  );
}
