import { Fragment } from "react";

import type { PurchaseOrder } from "@/types/contracts";

interface PurchaseOrdersListProps {
  purchaseOrders: PurchaseOrder[];
}

const formatCurrency = (
  value: number | null | undefined,
  currency: string | null | undefined,
) =>
  value === null || value === undefined
    ? "Not available"
    : `${currency ?? "USD"} ${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
};

const normalizeStatus = (status: string | null | undefined) =>
  status ? status.replace(/_/g, " ") : "Status unavailable";

const isOpenOrder = (order: PurchaseOrder) =>
  ["draft", "submitted", "confirmed", "shipped"].includes(order.status ?? "");

const statusTone = (status: string | null | undefined) => {
  if (status === "received") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-slate-100 text-slate-500";
  }

  if (
    status === "confirmed" ||
    status === "submitted" ||
    status === "shipped"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-50 text-slate-700";
};

const orderedUnitCount = (order: PurchaseOrder) =>
  order.ordered_unit_count ??
  order.items?.reduce(
    (total, item) => total + (item.quantity_ordered ?? 0),
    0,
  ) ??
  0;

const lineItemCount = (order: PurchaseOrder) =>
  order.line_item_count ?? order.items?.length ?? 0;

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
  const totalLineItems = purchaseOrders.reduce(
    (total, order) => total + lineItemCount(order),
    0,
  );
  const totalOrderedUnits = purchaseOrders.reduce(
    (total, order) => total + orderedUnitCount(order),
    0,
  );
  const recordedValue = purchaseOrders.reduce(
    (total, order) => total + (order.total_amount ?? 0),
    0,
  );

  return (
    <section className="space-y-5">
      <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
          PDS Health purchasing
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-lighthouse-primary">
          Purchase Orders
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review purchase order records currently available from verified
          Dentira/Patterson purchasing evidence.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total orders"
          value={purchaseOrders.length}
          description={
            purchaseOrders.length === 0
              ? "No purchase orders are currently listed"
              : "Verified order records currently listed"
          }
          tone={purchaseOrders.length > 0 ? "success" : "default"}
        />
        <SummaryCard
          label="Known active orders"
          value={openOrders.length}
          description={
            openOrders.length === 0
              ? "No source-backed active status is available"
              : "Orders with a supported active status"
          }
          tone={openOrders.length > 0 ? "attention" : "default"}
        />
        <SummaryCard
          label="Recorded value"
          value={formatCurrency(recordedValue, "USD")}
          description="Sum of listed order totals"
        />
      </div>

      {purchaseOrders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            label="Line items"
            value={totalLineItems}
            description="Product lines from verified order records"
            tone="success"
          />
          <SummaryCard
            label="Ordered units"
            value={totalOrderedUnits}
            description="Sum of quantities ordered across listed lines"
            tone="attention"
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            PDS Health purchase orders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Totals and line counts reflect source-backed Dentira/Patterson
            purchasing records. Shipping, tax, and fulfillment details are shown
            only when available.
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
              No purchase orders are currently listed for this workspace. When
              orders are available, this table will show the source-backed PO
              number, supplier, total, and order date.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">PO Number</th>
                  <th className="px-4 py-3 font-bold">Supplier</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Lines</th>
                  <th className="px-4 py-3 text-right font-bold">Units</th>
                  <th className="px-4 py-3 text-right font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Order date</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((order) => (
                  <Fragment key={order.id}>
                    <tr
                      className="border-t border-slate-100 align-top"
                      data-testid="purchase-order-row"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {order.po_number}
                        </p>
                        {order.order_number ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Order {order.order_number}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {order.supplier_name ?? "Not available"}
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
                        {lineItemCount(order)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900">
                        {orderedUnitCount(order)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900">
                        {formatCurrency(order.total_amount, order.currency)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {formatDate(order.po_date)}
                      </td>
                    </tr>
                    {order.items && order.items.length > 0 ? (
                      <tr
                        key={`${order.id}-items`}
                        className="border-t border-slate-100 bg-slate-50/60"
                      >
                        <td colSpan={7} className="px-5 py-4">
                          <div className="rounded-lg border border-slate-200 bg-white">
                            <div className="border-b border-slate-100 px-4 py-3">
                              <p className="text-sm font-bold text-slate-900">
                                Source-backed order lines
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Quantities and prices come from Dentira/Patterson
                                order details. These lines do not create
                                inventory quantities.
                              </p>
                            </div>
                            <div className="max-h-[560px] overflow-auto">
                              <table className="min-w-[900px] text-xs">
                                <thead className="bg-slate-50 text-left text-slate-500">
                                  <tr>
                                    <th className="px-4 py-2 font-bold">
                                      Line
                                    </th>
                                    <th className="px-4 py-2 font-bold">
                                      Product
                                    </th>
                                    <th className="px-4 py-2 font-bold">
                                      Brand
                                    </th>
                                    <th className="px-4 py-2 font-bold">
                                      Item #
                                    </th>
                                    <th className="px-4 py-2 text-right font-bold">
                                      Qty
                                    </th>
                                    <th className="px-4 py-2 text-right font-bold">
                                      Unit price
                                    </th>
                                    <th className="px-4 py-2 text-right font-bold">
                                      Line total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item) => (
                                    <tr
                                      key={item.id}
                                      className="border-t border-slate-100 align-top"
                                      data-testid="purchase-order-item-row"
                                    >
                                      <td className="px-4 py-3 text-slate-500">
                                        {item.source_line_number ?? "-"}
                                      </td>
                                      <td className="max-w-sm px-4 py-3">
                                        <p className="font-semibold text-slate-900">
                                          {item.product_name ??
                                            "Product name unavailable"}
                                        </p>
                                        {item.raw_description ? (
                                          <p className="mt-1 text-slate-500">
                                            {item.raw_description}
                                          </p>
                                        ) : null}
                                      </td>
                                      <td className="px-4 py-3 text-slate-700">
                                        {item.brand_or_manufacturer ??
                                          "Not available"}
                                      </td>
                                      <td className="px-4 py-3 text-slate-700">
                                        {item.vendor_item_number ??
                                          "Not available"}
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {item.quantity_ordered ?? "-"}
                                      </td>
                                      <td className="px-4 py-3 text-right text-slate-700">
                                        {formatCurrency(
                                          item.unit_price,
                                          order.currency,
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(
                                          item.line_total,
                                          order.currency,
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
