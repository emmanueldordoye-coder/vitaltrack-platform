import { fireEvent, render, screen, within } from "@testing-library/react";

import ProductCatalogPage from "./page";
import { ApiClientError } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";
import type { ProductCatalogItem } from "@/types/contracts";

jest.mock("@/lib/api/server", () => ({
  createServerApiClient: jest.fn(),
}));

const mockedCreateServerApiClient = jest.mocked(createServerApiClient);

const makeCatalogItem = (
  overrides: Partial<ProductCatalogItem> = {},
): ProductCatalogItem => ({
  source_purchase_order_item_id: "source-line-1",
  product_id: "product-1",
  sku: "DENTIRA-070367854",
  product_name: "Braval Nitrile PF Exam Gloves",
  product_description:
    "Powder Free Lavender Blue Small 300/Pkg catalog product",
  raw_description:
    "Braval Nitrile PF Exam Gloves - Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854",
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
});

describe("ProductCatalogPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders source-backed Dentira product identity without inventory fields", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listProductCatalog: jest.fn().mockResolvedValue([
        makeCatalogItem(),
        makeCatalogItem({
          product_id: "product-2",
          sku: "DENTIRA-NXTHG5002CR",
          product_name: "Solmetex NXT Hg5 Collection Container",
          product_description: "With Recycle Kit Ea",
          brand_or_manufacturer: "Solmetex",
          vendor_item_number: "NXTHG5002CR",
          last_known_unit_price: 299.99,
          source_line_number: 8,
          source_purchase_order_item_id: "source-line-2",
        }),
      ]),
      listFacilities: jest.fn().mockResolvedValue([
        {
          id: "facility-dentira",
          name: "Dentira Main Office",
        },
      ]),
    } as never);

    render(await ProductCatalogPage({}));

    expect(screen.getByText("Product Catalog")).toBeInTheDocument();
    expect(screen.getByText("PDS Health product catalog")).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("product-catalog-summary-products-shown"),
      ).getByText("2"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("product-catalog-summary-source-pos"),
      ).getByText("1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Braval Nitrile PF Exam Gloves"),
    ).toBeInTheDocument();
    expect(screen.getByText("Braval")).toBeInTheDocument();
    expect(screen.getAllByText("Patterson Dental Supply Inc")).toHaveLength(2);
    expect(screen.getByText("070367854")).toBeInTheDocument();
    expect(screen.getByText("USD 7.83")).toBeInTheDocument();
    expect(screen.getAllByText("Seen in PO PTU317717")).toHaveLength(2);
    expect(screen.getAllByTestId("product-catalog-row")).toHaveLength(2);
    expect(screen.getByText("Draft Purchase Order")).toBeInTheDocument();
    expect(screen.getByText("PDS Health pilot site")).toBeInTheDocument();
    expect(screen.getAllByText("Add to Draft")).toHaveLength(2);
    expect(
      screen.getByAltText(
        "Braval Nitrile PF Exam Gloves thumbnail from Dentira order evidence",
      ),
    ).toHaveAttribute(
      "src",
      expect.stringContaining(
        "%2Fdentira%2Fproduct-catalog%2Fptu317717%2Fline-001.png",
      ),
    );
    expect(
      screen.getByAltText(
        "Solmetex NXT Hg5 Collection Container thumbnail from Dentira order evidence",
      ),
    ).toHaveAttribute(
      "src",
      expect.stringContaining(
        "%2Fdentira%2Fproduct-catalog%2Fptu317717%2Fline-008.png",
      ),
    );
    expect(screen.queryByText(/^Qty$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Par$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Reorder$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Location$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Low stock$/i)).not.toBeInTheDocument();
  });

  it("renders all 42 PO-backed thumbnail mappings", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listProductCatalog: jest.fn().mockResolvedValue(
        Array.from({ length: 42 }, (_, index) =>
          makeCatalogItem({
            product_id: `product-${index + 1}`,
            source_purchase_order_item_id: `source-line-${index + 1}`,
            product_name: `Dentira Catalog Product ${index + 1}`,
            vendor_item_number: `ITEM-${String(index + 1).padStart(3, "0")}`,
            source_line_number: index + 1,
          }),
        ),
      ),
      listFacilities: jest.fn().mockResolvedValue([
        {
          id: "facility-dentira",
          name: "Dentira Main Office",
        },
      ]),
    } as never);

    render(await ProductCatalogPage({}));

    expect(screen.getAllByTestId("product-catalog-row")).toHaveLength(42);
    expect(
      within(
        screen.getByTestId("product-catalog-summary-products-shown"),
      ).getByText("42"),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "Dentira Catalog Product 42 thumbnail from Dentira order evidence",
      ),
    ).toHaveAttribute(
      "src",
      expect.stringContaining(
        "%2Fdentira%2Fproduct-catalog%2Fptu317717%2Fline-042.png",
      ),
    );
  });

  it("uses a neutral placeholder when no reliable thumbnail mapping exists", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listProductCatalog: jest.fn().mockResolvedValue([
        makeCatalogItem({
          source_po_number: "OTHERPO",
          source_line_number: 1,
        }),
      ]),
      listFacilities: jest.fn().mockResolvedValue([
        {
          id: "facility-dentira",
          name: "Dentira Main Office",
        },
      ]),
    } as never);

    render(await ProductCatalogPage({}));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Catalog")).toBeInTheDocument();
  });

  it("falls back to the neutral placeholder if a mapped thumbnail fails to load", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listProductCatalog: jest.fn().mockResolvedValue([makeCatalogItem()]),
      listFacilities: jest.fn().mockResolvedValue([
        {
          id: "facility-dentira",
          name: "Dentira Main Office",
        },
      ]),
    } as never);

    render(await ProductCatalogPage({}));

    fireEvent.error(
      screen.getByAltText(
        "Braval Nitrile PF Exam Gloves thumbnail from Dentira order evidence",
      ),
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Catalog")).toBeInTheDocument();
  });

  it("passes search through to the product catalog endpoint", async () => {
    const listProductCatalog = jest.fn().mockResolvedValue([]);
    const listFacilities = jest.fn().mockResolvedValue([
      {
        id: "facility-dentira",
        name: "Dentira Main Office",
      },
    ]);
    mockedCreateServerApiClient.mockResolvedValue({
      listProductCatalog,
      listFacilities,
    } as never);

    render(
      await ProductCatalogPage({
        searchParams: {
          search: "NXTHG5002CR",
        },
      }),
    );

    expect(listProductCatalog).toHaveBeenCalledWith({
      limit: 100,
      search: "NXTHG5002CR",
    });
    expect(listFacilities).toHaveBeenCalledWith({
      limit: 25,
    });
    expect(screen.getByDisplayValue("NXTHG5002CR")).toBeInTheDocument();
    expect(
      screen.getByText(
        'No source-backed catalog products match "NXTHG5002CR".',
      ),
    ).toBeInTheDocument();
  });

  it("renders backend auth diagnostics instead of crashing", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listProductCatalog: jest.fn().mockRejectedValue(
        new ApiClientError({
          code: "AUTH_TOKEN_PROJECT_MISMATCH",
          message: "Access token was issued by a different Supabase project.",
          status: 401,
        }),
      ),
      listFacilities: jest.fn().mockResolvedValue([]),
    } as never);

    render(await ProductCatalogPage({}));

    expect(
      screen.getByText("Workspace connection needs attention"),
    ).toBeInTheDocument();
    expect(screen.getByText("wrong_supabase_project")).toBeInTheDocument();
  });
});
