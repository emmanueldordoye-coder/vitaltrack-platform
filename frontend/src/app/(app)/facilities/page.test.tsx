import { render, screen, within } from "@testing-library/react";

import FacilitiesPage from "./page";
import { ApiClientError } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";

jest.mock("@/lib/api/server", () => ({
  createServerApiClient: jest.fn(),
}));

const mockedCreateServerApiClient = jest.mocked(createServerApiClient);

describe("FacilitiesPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders facilities when the backend request succeeds", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockResolvedValue([
        {
          id: "facility-1",
          name: "Dentira Main Office",
          facility_type: "dental_office",
          address: "1200 Congress Avenue",
          city: "Austin",
          country: "US",
          created_at: "2026-07-01T00:00:00Z",
          email: null,
          is_active: true,
          metadata: null,
          organization_id: "org-1",
          phone: null,
          postal_code: "78701",
          state: "TX",
          timezone: "America/Chicago",
          updated_at: "2026-07-01T00:00:00Z",
        },
      ]),
    } as never);

    render(await FacilitiesPage());

    const facilityRow = screen.getByTestId("facility-row");

    expect(screen.getByText("Dentira workspace")).toBeInTheDocument();
    expect(within(facilityRow).getByText("Dentira Main Office")).toBeInTheDocument();
    expect(screen.getByText("Dental Office")).toBeInTheDocument();
    expect(screen.getByText("Austin, TX")).toBeInTheDocument();
    expect(screen.getByText("America/Chicago")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByTestId("facilities-summary-visible-sites")).toHaveTextContent(
      "1",
    );
    expect(facilityRow).toBeInTheDocument();
  });

  it("renders an empty state when no facilities are returned", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockResolvedValue([]),
    } as never);

    render(await FacilitiesPage());

    expect(screen.getByText("No facilities listed")).toBeInTheDocument();
    expect(screen.getByTestId("facilities-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("facilities-summary-visible-sites")).toHaveTextContent(
      "0",
    );
  });

  it("does not render the create-facility form as a primary demo action", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockResolvedValue([]),
    } as never);

    render(await FacilitiesPage());

    expect(
      screen.queryByRole("button", { name: "Create facility" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Facility name")).not.toBeInTheDocument();
  });

  it("renders backend auth diagnostics instead of crashing", async () => {
    mockedCreateServerApiClient.mockResolvedValue({
      listFacilities: jest.fn().mockRejectedValue(
        new ApiClientError({
          code: "AUTH_TOKEN_PROJECT_MISMATCH",
          message: "Access token was issued by a different Supabase project.",
          status: 401,
        }),
      ),
    } as never);

    render(await FacilitiesPage());

    expect(
      screen.getByText("Workspace connection needs attention"),
    ).toBeInTheDocument();
    expect(screen.getByText("wrong_supabase_project")).toBeInTheDocument();
  });
});
