import { render, screen } from "@testing-library/react";

import DashboardPage from "./page";
import { ApiClientError } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";

jest.mock("@/lib/api/server", () => ({
  createServerApiClient: jest.fn(),
}));

const mockedCreateServerApiClient = jest.mocked(createServerApiClient);

describe("DashboardPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders dashboard counts when backend API calls succeed", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockResolvedValue([{ id: "facility-1" }]),
      listInventoryItems: jest
        .fn()
        .mockResolvedValue([
          { product_id: "product-1" },
          { product_id: "product-2" },
        ]),
      listPurchaseOrders: jest.fn().mockResolvedValue([]),
    } as never);

    render(await DashboardPage());

    expect(screen.getByText("Facilities")).toBeInTheDocument();
    expect(screen.getByText("Inventory items")).toBeInTheDocument();
    expect(screen.getByText("Purchase orders")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders a session validation state instead of crashing on backend 401", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockRejectedValue(
        new ApiClientError({
          code: "AUTH_TOKEN_INVALID",
          message: "Access token is invalid or expired.",
          status: 401,
        }),
      ),
      listInventoryItems: jest.fn(),
      listPurchaseOrders: jest.fn(),
    } as never);

    render(await DashboardPage());

    expect(screen.getByText("Session validation required")).toBeInTheDocument();
    expect(
      screen.getByText(/could not validate this session/i),
    ).toBeInTheDocument();
    expect(screen.getByText("invalid_or_expired_jwt")).toBeInTheDocument();
  });

  it("renders the wrong Supabase project diagnostic instead of crashing", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockRejectedValue(
        new ApiClientError({
          code: "AUTH_TOKEN_PROJECT_MISMATCH",
          message: "Access token was issued by a different Supabase project.",
          status: 401,
        }),
      ),
      listInventoryItems: jest.fn(),
      listPurchaseOrders: jest.fn(),
    } as never);

    render(await DashboardPage());

    expect(
      screen.getByText("Backend Supabase project mismatch"),
    ).toBeInTheDocument();
    expect(screen.getByText("wrong_supabase_project")).toBeInTheDocument();
    expect(screen.getByText("401")).toBeInTheDocument();
  });

  it("renders an organization access state instead of crashing on backend 403", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockRejectedValue(
        new ApiClientError({
          code: "AUTH_ORGANIZATION_REQUIRED",
          message:
            "Authenticated user does not have an active organization context.",
          status: 403,
        }),
      ),
      listInventoryItems: jest.fn(),
      listPurchaseOrders: jest.fn(),
    } as never);

    render(await DashboardPage());

    expect(
      screen.getByText("Organization access required"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not assigned to an active organization/i),
    ).toBeInTheDocument();
  });

  it("distinguishes workspace lookup failures from authentication failures", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockRejectedValue(
        new ApiClientError({
          code: "AUTH_WORKSPACE_LOOKUP_FAILED",
          message:
            "Unable to resolve organization context for the authenticated user.",
          status: 403,
        }),
      ),
      listInventoryItems: jest.fn(),
      listPurchaseOrders: jest.fn(),
    } as never);

    render(await DashboardPage());

    expect(
      screen.getByText("Workspace validation required"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/could not load the organization workspace/i),
    ).toBeInTheDocument();
  });
});
