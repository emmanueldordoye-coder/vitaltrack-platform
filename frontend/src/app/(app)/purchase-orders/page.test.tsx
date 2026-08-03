import { render, screen } from "@testing-library/react";

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
        },
      ]),
    } as never);

    render(await PurchaseOrdersPage());

    expect(screen.getByText("PO-1001")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
    expect(screen.getByText("USD 125.50")).toBeInTheDocument();
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
