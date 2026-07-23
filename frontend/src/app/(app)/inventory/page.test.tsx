import { render, screen } from "@testing-library/react";

import InventoryPage from "./page";
import { createServerApiClient } from "@/lib/api/server";

jest.mock("@/lib/api/server", () => ({
  createServerApiClient: jest.fn(),
}));

const mockedCreateServerApiClient = jest.mocked(createServerApiClient);

describe("InventoryPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders Lighthouse inventory rows", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listInventoryItems: jest.fn().mockResolvedValue([
        {
          product_id: "product-1",
          sku: "PAT-GLV-NIT-M",
          product_name: "Nitrile Exam Gloves, Medium",
          manufacturer_part_number: "PDS-GLV-NIT-M",
          current_quantity: 18,
          par_level: 60,
          reorder_point: 30,
          location_id: "location-1",
          location_name: "Operatory Cabinet A",
          vendor_id: "vendor-1",
          vendor_name: "Patterson Dental",
          unit_cost: 12.5,
          is_low_stock: true,
        },
      ]),
    } as never);

    render(await InventoryPage());

    expect(screen.getByText("PAT-GLV-NIT-M")).toBeInTheDocument();
    expect(screen.getByText("Nitrile Exam Gloves, Medium")).toBeInTheDocument();
    expect(screen.getByText("Patterson Dental")).toBeInTheDocument();
    expect(screen.getByText("Low stock")).toBeInTheDocument();
    expect(screen.getByText("USD 12.50")).toBeInTheDocument();
  });

  it("renders an empty state when no Lighthouse inventory exists", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listInventoryItems: jest.fn().mockResolvedValue([]),
    } as never);

    render(await InventoryPage());

    expect(
      screen.getByText("No Lighthouse inventory levels found."),
    ).toBeInTheDocument();
  });
});
