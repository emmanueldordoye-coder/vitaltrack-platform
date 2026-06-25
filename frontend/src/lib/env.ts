import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url()
    .default("http://localhost:4000/api/v1"),
});

const serverEnvSchema = z.object({
  API_BASE_URL: z.string().url().optional(),
});

const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

const serverEnv = serverEnvSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
});

export const env = {
  supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  publicApiBaseUrl: publicEnv.NEXT_PUBLIC_API_BASE_URL,
  apiBaseUrl: serverEnv.API_BASE_URL ?? publicEnv.NEXT_PUBLIC_API_BASE_URL,
} as const;
