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

    const client = new VitalTrackApiClient("token123", "http://localhost:4000/api/v1");
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
          message: "A valid Supabase access token is required for this endpoint.",
        },
        meta: {
          requestId: "req_123",
          timestamp: new Date().toISOString(),
          version: "v1",
        },
      }),
    } as Response);

    const client = new VitalTrackApiClient("bad-token", "http://localhost:4000/api/v1");

    await expect(client.listFacilities()).rejects.toBeInstanceOf(ApiClientError);
  });
});
