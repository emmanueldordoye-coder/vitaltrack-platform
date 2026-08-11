import {
  dentiraProductThumbnailMap,
  getProductThumbnailSrc,
} from "./product-image-map";
import type { ProductCatalogItem } from "@/types/contracts";

const makeItem = (
  overrides: Partial<ProductCatalogItem> = {},
): ProductCatalogItem =>
  ({
    source_purchase_order_item_id: "source-line-1",
    product_id: "product-1",
    sku: "DENTIRA-070367854",
    product_name: "Braval Nitrile PF Exam Gloves",
    product_description: "Powder Free Lavender Blue Small 300/Pkg",
    raw_description: null,
    manufacturer_part_number: null,
    brand_or_manufacturer: "Braval",
    supplier_name: "Patterson Dental Supply Inc",
    vendor_id: "vendor-patterson",
    vendor_item_number: "070367854",
    last_known_unit_price: 7.83,
    currency: "USD",
    source_po_number: "PTU317717",
    source_order_number: "6209555669",
    source_order_date: "2026-06-12T00:00:00",
    source_line_number: 1,
    image_reference: "IMG_4093.PNG",
    image_source_page: "1/4",
    image_strategy: "source-screenshot-reference",
    ...overrides,
  }) as ProductCatalogItem;

describe("product image mapping", () => {
  it("maps all 42 Dentira PO source lines to local thumbnail assets", () => {
    expect(Object.keys(dentiraProductThumbnailMap)).toHaveLength(42);
    expect(dentiraProductThumbnailMap["PTU317717:1"]).toBe(
      "/dentira/product-catalog/ptu317717/line-001.png",
    );
    expect(dentiraProductThumbnailMap["PTU317717:42"]).toBe(
      "/dentira/product-catalog/ptu317717/line-042.png",
    );
  });

  it("returns a thumbnail only for the source-backed Dentira purchase order", () => {
    expect(getProductThumbnailSrc(makeItem())).toBe(
      "/dentira/product-catalog/ptu317717/line-001.png",
    );
    expect(
      getProductThumbnailSrc(makeItem({ source_po_number: "OTHERPO" })),
    ).toBeNull();
    expect(
      getProductThumbnailSrc(makeItem({ source_line_number: 99 })),
    ).toBeNull();
    expect(
      getProductThumbnailSrc(makeItem({ source_line_number: null })),
    ).toBeNull();
  });
});
