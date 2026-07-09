/**
 * /suggested-orders — Suggested Orders list
 *
 * Step 2 of the Lighthouse workflow. Shows all suggested orders and lets
 * the user generate a new one by scanning for low-stock items.
 */
import Link from "next/link";

import { createServerApiClient } from "@/lib/api/server";
import type { SuggestedOrder } from "@/types/contracts";

import { generateOrderAction } from "./[id]/actions";

/** Status badge for a suggested order. */
function StatusBadge({ status }: { status: SuggestedOrder["status"] }) {
  const styles: Record<SuggestedOrder["status"], string> = {
    pending_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    submitted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  const labels: Record<SuggestedOrder["status"], string> = {
    pending_review: "Pending Review",
    approved: "Approved",
    submitted: "Submitted",
    rejected: "Rejected",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default async function SuggestedOrdersPage({
  searchParams,
}: {
  searchParams?: { notice?: string };
}) {
  const api = await createServerApiClient();

  // Fetch facilities to populate the hidden facilityId for order generation
  const facilities = await api.listFacilities({ limit: 1 });
  const facilityId = facilities[0]?.id;

  // Fetch existing suggested orders (most recent first)
  const orders = await api.listSuggestedOrders({ limit: 25 });

  const noLowStockNotice = searchParams?.notice === "no_low_stock";

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Suggested Orders
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Auto-generated orders based on low-stock detection. Review and
            approve to submit to your supplier.
          </p>
        </div>

        {/* Generate Order form — uses a Server Action */}
        {facilityId && (
          <form action={generateOrderAction}>
            <input type="hidden" name="facilityId" value={facilityId} />
            <button
              type="submit"
              className="flex-shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              + Generate Suggested Order
            </button>
          </form>
        )}
      </header>

      {/* Notice: no low-stock items were found */}
      {noLowStockNotice && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          All items are at or above their reorder levels — no order needed right now.
          Check the <Link href="/catalog" className="font-medium underline">Catalog</Link> to verify stock levels.
        </div>
      )}

      {/* Orders table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Est. Total</th>
              <th className="px-4 py-3">Generated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No suggested orders yet. Click{" "}
                  <strong>Generate Suggested Order</strong> to start the
                  workflow.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {order.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {(order.supplier as { name: string } | null)?.name ??
                    "Unknown supplier"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  {order.total_estimated_cost != null
                    ? `$${order.total_estimated_cost.toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(order.generated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {order.status === "pending_review" ? (
                    <Link
                      href={`/suggested-orders/${order.id}`}
                      className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                    >
                      Review →
                    </Link>
                  ) : order.status === "submitted" ? (
                    <Link
                      href={`/suggested-orders/${order.id}/confirmation`}
                      className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      View Confirmation
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
