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
      within(screen.getByTestId("purchase-orders-summary-total-orders")).getByText(
        "0",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("purchase-orders-summary-open-orders")).getByText(
        "0",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("purchase-orders-summary-recorded-value")).getByText(
        "USD 0.00",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("No purchase orders listed")).toBeInTheDocument();
    expect(
      screen.getByText(/No purchase orders are currently listed for Dentira/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("purchase-order-row")).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Purchase Order/i)).not.toBeInTheDocument();
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
        },
      ]),
    } as never);

    render(await PurchaseOrdersPage());

    expect(screen.getByText("PO-1001")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
    expect(screen.getAllByText("USD 125.50")).toHaveLength(2);
    expect(screen.getByText("2026-07-31")).toBeInTheDocument();
    expect(screen.getByText("2026-08-04")).toBeInTheDocument();
    expect(screen.getAllByTestId("purchase-order-row")).toHaveLength(1);
    expect(
      within(screen.getByTestId("purchase-orders-summary-total-orders")).getByText(
        "1",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("purchase-orders-summary-open-orders")).getByText(
        "1",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("0 of 1 listed orders are marked received."),
    ).toBeInTheDocument();
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
      screen.getByText("Backend Supabase project mismatch"),
    ).toBeInTheDocument();
    expect(screen.getByText("wrong_supabase_project")).toBeInTheDocument();
    expect(screen.getByText("401")).toBeInTheDocument();
  });
});
