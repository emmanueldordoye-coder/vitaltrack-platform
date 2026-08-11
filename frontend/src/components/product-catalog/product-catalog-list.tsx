import type { ProductCatalogItem } from "@/types/contracts";

interface ProductCatalogListProps {
  items: ProductCatalogItem[];
  searchQuery?: string;
}

const formatCurrency = (
  value: number | null,
  currency: string | null,
) =>
  value === null
    ? "Not available"
    : `${currency ?? "USD"} ${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const uniqueCount = (values: Array<string | null>) =>
  new Set(values.filter((value): value is string => Boolean(value))).size;

const SummaryCard = ({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  tone?: "default" | "success" | "source";
}) => {
  const toneClass = {
    default: "border-slate-200 text-lighthouse-primary",
    success: "border-emerald-200 text-lighthouse-accent",
    source: "border-blue-200 text-blue-700",
  }[tone];
  const testId = `product-catalog-summary-${label
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

const ProductPlaceholder = ({ item }: { item: ProductCatalogItem }) => {
  const initials = (item.brand_or_manufacturer ?? item.supplier_name ?? "PO")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex aspect-square min-h-[92px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
      <div className="text-center">
        <p className="text-xl font-bold text-lighthouse-primary">
          {initials || "PO"}
        </p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Catalog
        </p>
      </div>
    </div>
  );
};

const SourceBadge = ({ item }: { item: ProductCatalogItem }) =>
  item.source_po_number ? (
    <span className="inline-flex w-fit rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
      Seen in PO {item.source_po_number}
    </span>
  ) : (
    <span className="inline-flex w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
      Purchasing catalog
    </span>
  );

export const ProductCatalogList = ({
  items,
  searchQuery = "",
}: ProductCatalogListProps) => {
  const supplierCount = uniqueCount(items.map((item) => item.supplier_name));
  const sourceOrderCount = uniqueCount(
    items.map((item) => item.source_po_number),
  );

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
            Dentira product catalog
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-lighthouse-primary">
            Product Catalog
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Browse source-backed Dentira products found in verified Patterson
            Dental purchasing records. Catalog products are shown separately
            from current inventory counts.
          </p>
        </div>

        <form action="/product-catalog" className="w-full xl:max-w-md">
          <label
            htmlFor="product-catalog-search"
            className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
          >
            Search products
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="product-catalog-search"
              name="search"
              type="search"
              defaultValue={searchQuery}
              placeholder="Search product, brand, or item #"
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
          label="Products shown"
          value={items.length}
          description="Catalog rows from purchasing evidence"
          tone={items.length > 0 ? "success" : "default"}
        />
        <SummaryCard
          label="Source POs"
          value={sourceOrderCount}
          description="Verified purchase orders represented"
          tone="source"
        />
        <SummaryCard
          label="Suppliers"
          value={supplierCount}
          description="Supplier names available in the result set"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Patterson purchasing products
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Unit prices and item numbers reflect the source order evidence.
            Stock levels, par values, reorder points, and storage locations
            remain in Inventory only when real inventory records exist.
          </p>
        </div>

        {items.length === 0 ? (
          <div
            className="px-5 py-12 text-center"
            data-testid="product-catalog-empty-state"
          >
            <p className="text-base font-semibold text-slate-900">
              No catalog products found
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {searchQuery
                ? `No source-backed catalog products match "${searchQuery}".`
                : "No source-backed catalog products are currently listed for this workspace."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {items.map((item) => (
              <article
                key={`${item.product_id}-${item.source_po_number ?? "catalog"}-${item.source_line_number ?? "line"}`}
                className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[112px_minmax(0,1fr)]"
                data-testid="product-catalog-row"
              >
                <ProductPlaceholder item={item} />

                <div className="min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <SourceBadge item={item} />
                      <h3 className="mt-3 text-base font-bold leading-6 text-slate-900">
                        {item.product_name}
                      </h3>
                      {item.product_description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.product_description}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 rounded-md bg-slate-50 px-3 py-2 text-left sm:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Last unit price
                      </p>
                      <p className="mt-1 text-sm font-bold text-lighthouse-primary">
                        {formatCurrency(
                          item.last_known_unit_price,
                          item.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Brand / manufacturer
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-800">
                        {item.brand_or_manufacturer ?? "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Supplier
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-800">
                        {item.supplier_name ?? "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Item number
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-800">
                        {item.vendor_item_number ?? "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Source line
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-800">
                        {item.source_line_number
                          ? `Line ${item.source_line_number}`
                          : "Not available"}
                      </dd>
                    </div>
                  </dl>

                  {item.raw_description ? (
                    <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                      Source description: {item.raw_description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
