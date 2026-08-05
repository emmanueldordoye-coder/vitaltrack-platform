import type { PurchaseOrder } from "@/types/contracts";

interface PurchaseOrdersListProps {
  purchaseOrders: PurchaseOrder[];
}

const formatCurrency = (
  value: number | null | undefined,
  currency: string | null | undefined,
) =>
  value === null || value === undefined
    ? "Not set"
    : `${currency ?? "USD"} ${value.toFixed(2)}`;

const formatDate = (value: string | null | undefined) => value ?? "Not set";

const normalizeStatus = (status: string | null | undefined) =>
  status ? status.replace(/_/g, " ") : "Not set";

const isOpenOrder = (order: PurchaseOrder) =>
  order.status !== "received" && order.status !== "cancelled";

const statusTone = (status: string | null | undefined) => {
  if (status === "received") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-slate-100 text-slate-500";
  }

  if (status === "confirmed" || status === "submitted" || status === "shipped") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-50 text-slate-700";
};

const SummaryCard = ({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  tone?: "default" | "success" | "attention";
}) => {
  const toneClass = {
    default: "border-slate-200 text-lighthouse-primary",
    success: "border-emerald-200 text-lighthouse-accent",
    attention: "border-blue-200 text-blue-700",
  }[tone];
  const testId = `purchase-orders-summary-${label
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

export const PurchaseOrdersList = ({
  purchaseOrders,
}: PurchaseOrdersListProps) => {
  const openOrders = purchaseOrders.filter(isOpenOrder);
  const receivedOrders = purchaseOrders.filter(
    (order) => order.status === "received",
  );
  const recordedValue = purchaseOrders.reduce(
    (total, order) => total + (order.total_amount ?? 0),
    0,
  );

  return (
    <section className="space-y-5">
      <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
          Purchasing workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-lighthouse-primary">
          Purchase Orders
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review purchase order records already available to the Dentira
          workspace using the existing backend purchase-order data.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total orders"
          value={purchaseOrders.length}
          description={
            purchaseOrders.length === 0
              ? "No purchase orders are currently listed"
              : "Purchase order records visible to this workspace"
          }
          tone={purchaseOrders.length > 0 ? "success" : "default"}
        />
        <SummaryCard
          label="Open orders"
          value={openOrders.length}
          description={
            openOrders.length === 0
              ? "No open purchase orders"
              : "Orders not marked received or cancelled"
          }
          tone={openOrders.length > 0 ? "attention" : "default"}
        />
        <SummaryCard
          label="Recorded value"
          value={`USD ${recordedValue.toFixed(2)}`}
          description="Sum of listed order totals"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Dentira purchase orders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Status and totals come from existing backend purchase-order records.
          </p>
        </div>

        {purchaseOrders.length === 0 ? (
          <div
            className="px-5 py-12 text-center"
            data-testid="purchase-orders-empty-state"
          >
            <p className="text-base font-semibold text-slate-900">
              No purchase orders listed
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Dentira does not currently have purchase-order rows in the staging
              seed. When purchase orders exist, this table will show the PO
              number, status, total, and order date from the existing API.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">PO Number</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Order date</th>
                  <th className="px-5 py-3 font-bold">Expected delivery</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-slate-100 align-top"
                    data-testid="purchase-order-row"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {order.po_number}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.id}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-bold capitalize ${statusTone(
                          order.status,
                        )}`}
                      >
                        {normalizeStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(order.total_amount, order.currency)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {formatDate(order.po_date)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {formatDate(order.expected_delivery_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {purchaseOrders.length > 0 ? (
        <p className="text-sm text-slate-500">
          {receivedOrders.length} of {purchaseOrders.length} listed orders are
          marked received.
        </p>
      ) : null}
    </section>
  );
};
