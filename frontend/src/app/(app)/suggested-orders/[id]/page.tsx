/**
 * /suggested-orders/[id] — Suggested Order Review
 *
 * Step 3–4 of the Lighthouse workflow. The staff member reviews each line
 * item, confirms quantities, then clicks "Approve & Submit to Patterson" to
 * move to the confirmation step.
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerApiClient } from "@/lib/api/server";
import { ApiClientError } from "@/lib/api/client";

import { approveOrderAction } from "./actions";

export default async function SuggestedOrderReviewPage({
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

  const isReviewable = order.status === "pending_review";

  return (
    <section className="space-y-6">
      {/* Back link */}
      <Link
        href="/suggested-orders"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to Suggested Orders
      </Link>

      {/* Order header */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Review Suggested Order
            </h1>
            <p className="mt-1 text-xs font-mono text-slate-400">{order.id}</p>
          </div>
          <span
            className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              order.status === "pending_review"
                ? "bg-yellow-100 text-yellow-800"
                : order.status === "submitted"
                  ? "bg-green-100 text-green-800"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {order.status === "pending_review"
              ? "Pending Review"
              : order.status === "submitted"
                ? "Submitted"
                : order.status}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-slate-500">Supplier</dt>
            <dd className="font-medium text-slate-900">
              {order.supplier?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Contact</dt>
            <dd className="text-slate-700">
              {order.supplier?.email ?? order.supplier?.phone ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Generated</dt>
            <dd className="text-slate-700">
              {new Date(order.generated_at).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Est. Total</dt>
            <dd className="font-semibold text-slate-900">
              {order.total_estimated_cost != null
                ? `$${order.total_estimated_cost.toFixed(2)}`
                : "—"}
            </dd>
          </div>
        </dl>

        {order.notes && (
          <p className="mt-3 text-sm text-slate-600 italic">{order.notes}</p>
        )}
      </div>

      {/* Line items */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Line Items ({order.items.length})
          </h2>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3">UOM</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {item.inventory_item?.sku ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {item.inventory_item?.name ?? "Unknown item"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.inventory_item?.category ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-800">
                  {item.quantity_approved ?? item.quantity_suggested}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {item.uom ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {item.unit_price != null
                    ? `$${item.unit_price.toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  {item.line_total != null
                    ? `$${item.line_total.toFixed(2)}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          {order.total_estimated_cost != null && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={6} className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                  Estimated Total
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-slate-900">
                  ${order.total_estimated_cost.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Approve action */}
      {isReviewable ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">
            Approve &amp; Submit
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Submitting will create a purchase order and mock-send it to{" "}
            <strong>{order.supplier?.name ?? "the supplier"}</strong>.
            A confirmation number will be generated.
          </p>

          {/* Server Action form — calls approveOrderAction */}
          <form action={approveOrderAction} className="mt-4 flex items-end gap-3">
            <input type="hidden" name="orderId" value={order.id} />
            <div className="flex-1">
              <label
                htmlFor="notes"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Notes (optional)
              </label>
              <input
                id="notes"
                name="notes"
                type="text"
                placeholder="e.g. Rush delivery requested"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="flex-shrink-0 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Approve &amp; Submit to Patterson →
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          This order has already been{" "}
          <strong>{order.status}</strong>.{" "}
          {order.purchase_order_id && (
            <Link
              href={`/suggested-orders/${order.id}/confirmation`}
              className="font-medium underline"
            >
              View confirmation →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
