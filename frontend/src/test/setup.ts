import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://localhost:4000/api/v1";

if (!global.fetch) {
  global.fetch = (async () => {
    throw new Error("Fetch is not mocked for this test.");
  }) as typeof fetch;
}
