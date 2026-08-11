import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { createDraftPurchaseOrder } from "@/app/(app)/product-catalog/actions";
import type { Facility, ProductCatalogItem } from "@/types/contracts";
import { ProductCatalogList } from "./product-catalog-list";

jest.mock("@/app/(app)/product-catalog/actions", () => ({
  createDraftPurchaseOrder: jest.fn(),
}));

const mockedCreateDraftPurchaseOrder = jest.mocked(createDraftPurchaseOrder);

const facility: Facility = {
  id: "facility-dentira",
  organization_id: "org-dentira",
  name: "Dentira Main Office",
  facility_type: "dental_office",
  address: null,
  city: "Pembroke Pines",
  state: "FL",
  postal_code: null,
  country: "US",
  phone: null,
  email: null,
  timezone: "America/New_York",
  is_active: true,
  metadata: null,
  created_at: null,
  updated_at: null,
};

const makeCatalogItem = (
  overrides: Partial<ProductCatalogItem> = {},
): ProductCatalogItem => ({
  source_purchase_order_item_id: "source-line-1",
  product_id: "product-1",
  sku: "DENTIRA-070367854",
  product_name: "Braval Nitrile PF Exam Gloves",
  product_description: "Powder Free Lavender Blue Small 300/Pkg",
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
  image_reference: null,
  image_source_page: null,
  image_strategy: "neutral-placeholder",
  ...overrides,
});

describe("ProductCatalogList draft order controls", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("creates an internal draft PO from selected catalog products", async () => {
    mockedCreateDraftPurchaseOrder.mockResolvedValue({
      status: "success",
      message:
        "Draft PO created in VitalTrack. Supplier submission integration is not enabled in this demo environment.",
      purchaseOrder: {
        id: "po-draft",
        facility_id: facility.id,
        supplier_id: null,
        vendor_id: "vendor-patterson",
        po_number: "VT-DRAFT-20260811-ABC12345",
        po_date: "2026-08-11T12:00:00Z",
        expected_delivery_date: null,
        actual_delivery_date: null,
        status: "draft",
        total_amount: 15.66,
        currency: "USD",
        notes: null,
        created_by: "user-1",
        updated_by: "user-1",
        created_at: null,
        updated_at: null,
      },
    });

    render(
      <ProductCatalogList
        facilities={[facility]}
        items={[makeCatalogItem()]}
      />,
    );

    fireEvent.click(screen.getByText("Add to Draft"));
    fireEvent.change(
      screen.getByLabelText("Quantity for Braval Nitrile PF Exam Gloves"),
      {
        target: { value: "2" },
      },
    );

    expect(
      within(screen.getByTestId("draft-order-subtotal")).getByText("USD 15.66"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("draft-order-create"));

    await waitFor(() => {
      expect(mockedCreateDraftPurchaseOrder).toHaveBeenCalledWith({
        facilityId: "facility-dentira",
        vendorId: "vendor-patterson",
        items: [
          {
            productId: "product-1",
            sourcePurchaseOrderItemId: "source-line-1",
            quantityOrdered: 2,
          },
        ],
      });
    });

    expect(
      screen.getByText(
        "Draft PO created in VitalTrack. Supplier submission integration is not enabled in this demo environment.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("View Purchase Orders")).toHaveAttribute(
      "href",
      "/purchase-orders",
    );
    expect(screen.queryByText(/Sent to Patterson/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Submitted to supplier/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Order placed/i)).not.toBeInTheDocument();
  });

  it("requires one supplier group before draft creation", () => {
    render(
      <ProductCatalogList
        facilities={[facility]}
        items={[
          makeCatalogItem(),
          makeCatalogItem({
            product_id: "product-2",
            source_purchase_order_item_id: "source-line-2",
            product_name: "Reli Disposable Safety Retractor Scalpel",
            supplier_name: "Another Supplier",
            vendor_id: "vendor-other",
            vendor_item_number: "6008TR15",
            last_known_unit_price: 13.75,
          }),
        ]}
      />,
    );

    screen.getAllByText("Add to Draft").forEach((button) => {
      fireEvent.click(button);
    });

    expect(
      screen.getByText(
        "Review one supplier at a time before creating a draft PO.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("draft-order-create")).toBeDisabled();
  });

  it("does not show inventory state for PO-only catalog products", () => {
    render(
      <ProductCatalogList
        facilities={[facility]}
        items={[makeCatalogItem()]}
      />,
    );

    expect(screen.queryByText(/^Qty$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Par$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Reorder$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Location$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Low stock$/i)).not.toBeInTheDocument();
  });

  it("uses the explicitly selected facility for draft PO creation", async () => {
    mockedCreateDraftPurchaseOrder.mockResolvedValue({
      status: "success",
      message:
        "Draft PO created in VitalTrack. Supplier submission integration is not enabled in this demo environment.",
      purchaseOrder: {
        id: "po-draft",
        facility_id: "facility-secondary",
        supplier_id: null,
        vendor_id: "vendor-patterson",
        po_number: "VT-DRAFT-20260811-ABC12345",
        po_date: "2026-08-11T12:00:00Z",
        expected_delivery_date: null,
        actual_delivery_date: null,
        status: "draft",
        total_amount: 7.83,
        currency: "USD",
        notes: null,
        created_by: "user-1",
        updated_by: "user-1",
        created_at: null,
        updated_at: null,
      },
    });

    render(
      <ProductCatalogList
        facilities={[
          facility,
          {
            ...facility,
            id: "facility-secondary",
            name: "Dentira Secondary Office",
          },
        ]}
        items={[makeCatalogItem()]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Facility"), {
      target: { value: "facility-secondary" },
    });
    fireEvent.click(screen.getByText("Add to Draft"));
    fireEvent.click(screen.getByTestId("draft-order-create"));

    await waitFor(() => {
      expect(mockedCreateDraftPurchaseOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          facilityId: "facility-secondary",
        }),
      );
    });
  });
});
