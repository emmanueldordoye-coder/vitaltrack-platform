const OLD_ENV = process.env;

describe("env", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("normalizes a backend origin API URL to exactly one /api/v1 segment", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    delete process.env.API_BASE_URL;

    const { env } = await import("./env");

    expect(env.publicApiBaseUrl).toBe("https://api.example.com/api/v1");
    expect(env.apiBaseUrl).toBe("https://api.example.com/api/v1");
  });

  it("preserves an API URL that already has exactly one /api/v1 segment", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/api/v1";
    process.env.API_BASE_URL = "https://server.example.com/api/v1";

    const { env } = await import("./env");

    expect(env.publicApiBaseUrl).toBe("https://api.example.com/api/v1");
    expect(env.apiBaseUrl).toBe("https://server.example.com/api/v1");
  });

  it("rejects API URLs with an unexpected path", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL =
      "https://api.example.com/api/v1/api/v1";

    await expect(import("./env")).rejects.toThrow(
      "exactly one /api/v1 segment",
    );
  });
});
