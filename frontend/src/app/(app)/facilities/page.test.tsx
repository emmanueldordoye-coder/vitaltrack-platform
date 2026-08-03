import { render, screen } from "@testing-library/react";

import FacilitiesPage from "./page";
import { ApiClientError } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";

jest.mock("@/lib/api/server", () => ({
  createServerApiClient: jest.fn(),
}));

jest.mock("./facility-form", () => ({
  FacilityForm: () => <div>Facility form</div>,
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
          city: "Atlanta",
          timezone: "America/New_York",
        },
      ]),
    } as never);

    render(await FacilitiesPage());

    expect(screen.getByText("Dentira Main Office")).toBeInTheDocument();
    expect(screen.getByText("dental_office")).toBeInTheDocument();
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
      screen.getByText("Backend Supabase project mismatch"),
    ).toBeInTheDocument();
    expect(screen.getByText("wrong_supabase_project")).toBeInTheDocument();
  });
});
