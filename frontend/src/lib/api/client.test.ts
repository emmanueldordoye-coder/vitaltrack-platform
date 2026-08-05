import { ApiClientError, VitalTrackApiClient } from "@/lib/api/client";

const makeSuccessPayload = <T>(data: T) => ({
  success: true as const,
  data,
  meta: {
    requestId: "req_123",
    timestamp: new Date().toISOString(),
    version: "v1",
  },
});

describe("VitalTrackApiClient", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("adds auth header and returns response data", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeSuccessPayload([{ id: "f1", name: "Facility A" }]),
    } as Response);

    const client = new VitalTrackApiClient(
      "token123",
      "http://localhost:4000/api/v1",
    );
    const facilities = await client.listFacilities({ limit: 1 });

    expect(facilities).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/facilities?limit=1"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token123",
        }),
      }),
    );
  });

  it("throws ApiClientError on backend errors", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message:
            "A valid Supabase access token is required for this endpoint.",
        },
        meta: {
          requestId: "req_123",
          timestamp: new Date().toISOString(),
          version: "v1",
        },
      }),
    } as Response);

    const client = new VitalTrackApiClient(
      "bad-token",
      "http://localhost:4000/api/v1",
    );

    await expect(client.listFacilities()).rejects.toBeInstanceOf(
      ApiClientError,
    );
  });

  it("classifies backend network or CORS failures without exposing the bearer token", async () => {
    jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new TypeError("Failed to fetch"));

    const client = new VitalTrackApiClient(
      "secret-token",
      "http://localhost:4000/api/v1",
    );

    await expect(client.listFacilities()).rejects.toMatchObject({
      code: "API_NETWORK_OR_CORS_ERROR",
      status: 0,
    });
  });

  it("classifies non-JSON backend responses", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response);

    const client = new VitalTrackApiClient(
      "token123",
      "http://localhost:4000/api/v1",
    );

    await expect(client.listFacilities()).rejects.toMatchObject({
      code: "API_RESPONSE_INVALID",
      status: 502,
    });
  });
});
