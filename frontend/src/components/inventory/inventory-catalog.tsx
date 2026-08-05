import type { InventoryCatalogItem } from "@/types/contracts";

interface InventoryCatalogProps {
  items: InventoryCatalogItem[];
  searchQuery?: string;
}

const formatCurrency = (value: number | null) =>
  value === null ? "Not set" : `USD ${value.toFixed(2)}`;

const StockBadge = ({ isLowStock }: { isLowStock: boolean }) => (
  <span
    className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-bold ${
      isLowStock ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
    }`}
  >
    {isLowStock ? "Low stock" : "In stock"}
  </span>
);

const SummaryCard = ({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: number;
  description: string;
  tone?: "default" | "attention" | "success";
}) => {
  const toneClass = {
    default: "border-slate-200 text-lighthouse-primary",
    attention: "border-red-200 text-red-700",
    success: "border-emerald-200 text-lighthouse-accent",
  }[tone];
  const testId = `inventory-summary-${label.toLowerCase().replace(/\s+/g, "-")}`;

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

export const InventoryCatalog = ({
  items,
  searchQuery = "",
}: InventoryCatalogProps) => {
  const lowStockCount = items.filter((item) => item.is_low_stock).length;
  const inStockCount = items.length - lowStockCount;

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
            Product master catalog
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-lighthouse-primary">
            Inventory Catalog
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track Dentira supply quantities, reorder points, storage locations,
            and Patterson Dental vendor context.
          </p>
        </div>

        <form action="/inventory" className="w-full xl:max-w-md">
          <label
            htmlFor="inventory-search"
            className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
          >
            Search catalog
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="inventory-search"
              name="search"
              type="search"
              defaultValue={searchQuery}
              placeholder="Search product, SKU, or MPN"
              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-lighthouse-accent focus:ring-2 focus:ring-lighthouse-accent/15"
            />
            <button
              type="submit"
              className="rounded-md bg-lighthouse-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-lighthouse-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lighthouse-primary"
            >
              Search
            </button>
          </div>
        </form>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total rows"
          value={items.length}
          description="Visible Product Catalog inventory rows"
          tone="success"
        />
        <SummaryCard
          label="Low stock"
          value={lowStockCount}
          description={
            lowStockCount === 0
              ? "No rows are at or below reorder point"
              : "Rows at or below reorder point"
          }
          tone={lowStockCount > 0 ? "attention" : "success"}
        />
        <SummaryCard
          label="In stock"
          value={inStockCount}
          description="Rows currently above reorder point"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Patterson Dental supplies
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Quantities compare current stock against par and reorder levels.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-base font-semibold text-slate-900">
              No inventory rows found
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {searchQuery
                ? `No Product Catalog rows match "${searchQuery}".`
                : "No Lighthouse inventory levels found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">Location</th>
                  <th className="px-4 py-3 font-bold">Vendor</th>
                  <th className="px-4 py-3 text-right font-bold">Qty</th>
                  <th className="px-4 py-3 text-right font-bold">Par</th>
                  <th className="px-4 py-3 text-right font-bold">Reorder</th>
                  <th className="px-4 py-3 text-right font-bold">
                    Unit cost
                  </th>
                  <th className="px-5 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={`${item.product_id}-${item.location_id}`}
                    className="border-t border-slate-100 align-top"
                    data-testid="inventory-row"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {item.product_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.sku}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        MPN {item.manufacturer_part_number ?? "Not set"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {item.location_name ?? "Not set"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {item.vendor_name ?? "Not set"}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900">
                      {item.current_quantity}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {item.par_level}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {item.reorder_point}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-5 py-4">
                      <StockBadge isLowStock={item.is_low_stock} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
