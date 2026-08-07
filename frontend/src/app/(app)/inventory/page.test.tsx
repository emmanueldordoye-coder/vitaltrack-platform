import { render, screen, within } from "@testing-library/react";

import InventoryPage from "./page";
import { ApiClientError } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";

jest.mock("@/lib/api/server", () => ({
  createServerApiClient: jest.fn(),
}));

const mockedCreateServerApiClient = jest.mocked(createServerApiClient);

const makeInventoryItem = ({
  index,
  isLowStock,
}: {
  index: number;
  isLowStock: boolean;
}) => ({
  product_id: `product-${index}`,
  sku: `PAT-DEMO-${index}`,
  product_name: `Patterson Demo Supply ${index}`,
  manufacturer_part_number: `PDS-DEMO-${index}`,
  current_quantity: isLowStock ? 4 : 18,
  par_level: 20,
  reorder_point: isLowStock ? 8 : 6,
  location_id: "location-1",
  location_name: "Dentira Main Office",
  vendor_id: "vendor-1",
  vendor_name: "Patterson Dental",
  unit_cost: 12.5,
  is_low_stock: isLowStock,
});

describe("InventoryPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders Dentira inventory rows with summary counts", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listInventoryItems: jest.fn().mockResolvedValue(
        Array.from({ length: 7 }, (_, index) =>
          makeInventoryItem({
            index: index + 1,
            isLowStock: index < 6,
          }),
        ),
      ),
    } as never);

    render(await InventoryPage({}));

    expect(screen.getByText("Inventory Catalog")).toBeInTheDocument();
    expect(screen.getByText("Total rows")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("inventory-summary-low-stock")).getByText(
        "Low stock",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("inventory-summary-in-stock")).getByText(
        "In stock",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Patterson Demo Supply 1")).toBeInTheDocument();
    expect(screen.getByText("MPN PDS-DEMO-1")).toBeInTheDocument();
    expect(screen.getAllByText("Patterson Dental")).toHaveLength(7);
    expect(screen.getAllByText("Low stock")).toHaveLength(7);
    expect(screen.getAllByText("In stock")).toHaveLength(2);
    expect(screen.getAllByTestId("inventory-row")).toHaveLength(7);
    expect(
      within(screen.getByTestId("inventory-summary-total-rows")).getByText("7"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("inventory-summary-low-stock")).getByText("6"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("inventory-summary-in-stock")).getByText("1"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/AI Recommendations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reorder All/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Barcode/i)).not.toBeInTheDocument();
  });

  it("renders an empty state when no inventory rows exist", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listInventoryItems: jest.fn().mockResolvedValue([]),
    } as never);

    render(await InventoryPage({}));

    expect(screen.getByText("No inventory rows found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No inventory rows are currently listed for this workspace.",
      ),
    ).toBeInTheDocument();
  });

  it("passes search through to the existing inventory endpoint", async () => {
    const listInventoryItems = jest.fn().mockResolvedValue([]);
    mockedCreateServerApiClient.mockResolvedValue({
      listInventoryItems,
    } as never);

    render(
      await InventoryPage({
        searchParams: {
          search: "gloves",
        },
      }),
    );

    expect(listInventoryItems).toHaveBeenCalledWith({
      limit: 50,
      search: "gloves",
    });
    expect(screen.getByDisplayValue("gloves")).toBeInTheDocument();
    expect(
      screen.getByText('No inventory rows match "gloves".'),
    ).toBeInTheDocument();
  });

  it("renders backend auth diagnostics instead of crashing", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listInventoryItems: jest.fn().mockRejectedValue(
        new ApiClientError({
          code: "AUTH_TOKEN_PROJECT_MISMATCH",
          message: "Access token was issued by a different Supabase project.",
          status: 401,
        }),
      ),
    } as never);

    render(await InventoryPage({}));

    expect(
      screen.getByText("Backend Supabase project mismatch"),
    ).toBeInTheDocument();
    expect(screen.getByText("wrong_supabase_project")).toBeInTheDocument();
  });
});
