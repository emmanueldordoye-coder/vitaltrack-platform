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
      listFacilities: jest
        .fn()
        .mockResolvedValue([{ id: "facility-1", name: "Dentira Main Office" }]),
      listInventoryItems: jest
        .fn()
        .mockResolvedValue([
          {
            product_id: "product-1",
            location_id: "location-1",
            product_name: "Patterson Exam Gloves",
            sku: "PAT-GLOVE-M",
            current_quantity: 4,
            reorder_point: 6,
            is_low_stock: true,
          },
          {
            product_id: "product-2",
            location_id: "location-1",
            product_name: "Patterson Prophy Paste",
            sku: "PAT-PROPHY",
            current_quantity: 18,
            reorder_point: 8,
            is_low_stock: false,
          },
        ]),
      listPurchaseOrders: jest.fn().mockResolvedValue([]),
    } as never);

    render(await DashboardPage());

    expect(screen.getByText("Facilities")).toBeInTheDocument();
    expect(screen.getByText("Inventory rows")).toBeInTheDocument();
    expect(screen.getByText("Low-stock items")).toBeInTheDocument();
    expect(screen.getByText("Purchase orders")).toBeInTheDocument();
    expect(screen.getAllByText("Dentira Main Office")).toHaveLength(3);
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.getAllByText("2")).toHaveLength(1);
  });

  it("derives low-stock count from inventory rows", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest
        .fn()
        .mockResolvedValue([{ id: "facility-1", name: "Dentira Main Office" }]),
      listInventoryItems: jest.fn().mockResolvedValue([
        {
          product_id: "product-1",
          location_id: "location-1",
          product_name: "Patterson Bonding Agent",
          sku: "PAT-BOND",
          current_quantity: 2,
          reorder_point: 4,
          is_low_stock: true,
        },
        {
          product_id: "product-2",
          location_id: "location-1",
          product_name: "Patterson Curing Light Sleeve",
          sku: "PAT-SLEEVE",
          current_quantity: 5,
          reorder_point: 5,
          is_low_stock: true,
        },
        {
          product_id: "product-3",
          location_id: "location-1",
          product_name: "Patterson Bibs",
          sku: "PAT-BIB",
          current_quantity: 22,
          reorder_point: 10,
          is_low_stock: false,
        },
      ]),
      listPurchaseOrders: jest.fn().mockResolvedValue([]),
    } as never);

    render(await DashboardPage());

    expect(screen.getByText("2 products are at or below reorder point"))
      .toBeInTheDocument();
    expect(screen.getAllByText("Low stock")).toHaveLength(2);
    expect(screen.queryByText(/monthly spend/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/savings/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/time saved/i)).not.toBeInTheDocument();
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

    expect(screen.getByText("Session needs attention")).toBeInTheDocument();
    expect(
      screen.getByText(/secure session could not be confirmed/i),
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
      screen.getByText("Workspace connection needs attention"),
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
      screen.getByText("Workspace access required"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not assigned to an active Dentira workspace/i),
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
      screen.getByText("Workspace access needs attention"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/could not load the Dentira workspace/i),
    ).toBeInTheDocument();
  });
});
