import { render, screen, within } from "@testing-library/react";

import PurchaseOrdersPage from "./page";
import { ApiClientError } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";

jest.mock("@/lib/api/server", () => ({
  createServerApiClient: jest.fn(),
}));

const mockedCreateServerApiClient = jest.mocked(createServerApiClient);

describe("PurchaseOrdersPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders an honest empty state when Dentira has no purchase orders", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listPurchaseOrders: jest.fn().mockResolvedValue([]),
    } as never);

    render(await PurchaseOrdersPage());

    expect(screen.getByText("Purchase Orders")).toBeInTheDocument();
    expect(screen.getByText("Dentira purchasing")).toBeInTheDocument();
    expect(screen.getByText("Total orders")).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("purchase-orders-summary-total-orders"),
      ).getByText("0"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("purchase-orders-summary-known-active-orders"),
      ).getByText("0"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("purchase-orders-summary-recorded-value"),
      ).getByText("USD 0.00"),
    ).toBeInTheDocument();
    expect(screen.getByText("No purchase orders listed")).toBeInTheDocument();
    expect(
      screen.getByText(/No purchase orders are currently listed for Dentira/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("purchase-order-row")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Create Purchase Order/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Suggested Orders/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Approval/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Receiving/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI ordering/i)).not.toBeInTheDocument();
  });

  it("renders purchase orders when the backend request succeeds", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listPurchaseOrders: jest.fn().mockResolvedValue([
        {
          id: "po-1",
          po_number: "PO-1001",
          status: "confirmed",
          total_amount: 125.5,
          currency: "USD",
          po_date: "2026-07-31",
          expected_delivery_date: "2026-08-04",
          line_item_count: 0,
          ordered_unit_count: 0,
          items: [],
        },
      ]),
    } as never);

    render(await PurchaseOrdersPage());

    expect(screen.getByText("PO-1001")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
    expect(screen.getAllByText("USD 125.50")).toHaveLength(2);
    expect(screen.getByText("Jul 31, 2026")).toBeInTheDocument();
    expect(screen.getAllByTestId("purchase-order-row")).toHaveLength(1);
    expect(
      within(
        screen.getByTestId("purchase-orders-summary-total-orders"),
      ).getByText("1"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("purchase-orders-summary-known-active-orders"),
      ).getByText("1"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/marked received/i)).not.toBeInTheDocument();
  });

  it("renders the source-backed Dentira PO without invented fulfillment claims", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listPurchaseOrders: jest.fn().mockResolvedValue([
        {
          id: "po-dentira",
          po_number: "PTU317717",
          order_number: "6209555669",
          supplier_name: "Patterson Dental Supply Inc",
          status: null,
          total_amount: 1384.47,
          currency: "USD",
          po_date: "2026-06-12T00:00:00",
          expected_delivery_date: null,
          line_item_count: 42,
          ordered_unit_count: 63,
          items: [
            {
              id: "line-1",
              purchase_order_id: "po-dentira",
              inventory_item_id: null,
              product_name:
                "Braval Nitrile PF Exam Gloves, Lavender Blue, Small",
              raw_description:
                "Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854",
              brand_or_manufacturer: "Braval",
              vendor_item_number: "070367854",
              source_line_number: 1,
              quantity_ordered: 2,
              quantity_received: 0,
              unit_price: 7.83,
              line_total: 15.66,
              uom: "order-unit",
              notes: null,
            },
          ],
        },
      ]),
    } as never);

    render(await PurchaseOrdersPage());

    expect(screen.getByText("PTU317717")).toBeInTheDocument();
    expect(screen.getByText("Order 6209555669")).toBeInTheDocument();
    expect(screen.getByText("Patterson Dental Supply Inc")).toBeInTheDocument();
    expect(screen.getByText("Jun 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("Status unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("USD 1,384.47")).toHaveLength(2);
    expect(
      within(
        screen.getByTestId("purchase-orders-summary-line-items"),
      ).getByText("42"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("purchase-orders-summary-ordered-units"),
      ).getByText("63"),
    ).toBeInTheDocument();
    expect(screen.getByText("Source-backed order lines")).toBeInTheDocument();
    expect(screen.getByText("070367854")).toBeInTheDocument();
    expect(screen.getByText("Braval")).toBeInTheDocument();
    expect(screen.getByText("USD 15.66")).toBeInTheDocument();
    expect(screen.queryByText(/tracking/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/approval/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/receiving/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/delivery date/i)).not.toBeInTheDocument();
  });

  it("renders backend auth diagnostics instead of crashing on project mismatch", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listPurchaseOrders: jest.fn().mockRejectedValue(
        new ApiClientError({
          code: "AUTH_TOKEN_PROJECT_MISMATCH",
          message: "Access token was issued by a different Supabase project.",
          status: 401,
        }),
      ),
    } as never);

    render(await PurchaseOrdersPage());

    expect(
      screen.getByText("Workspace connection needs attention"),
    ).toBeInTheDocument();
    expect(screen.getByText("wrong_supabase_project")).toBeInTheDocument();
    expect(screen.getByText("401")).toBeInTheDocument();
  });
});
