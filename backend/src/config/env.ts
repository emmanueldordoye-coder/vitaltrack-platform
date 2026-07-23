import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: ".env.local" });
loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  GIT_SHA: z.string().min(1).optional(),
  RENDER_GIT_COMMIT: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  API_TIMEOUT_MS: process.env.API_TIMEOUT_MS,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  LOG_LEVEL: process.env.LOG_LEVEL,
  SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  GIT_SHA: process.env.GIT_SHA,
  RENDER_GIT_COMMIT: process.env.RENDER_GIT_COMMIT,
});

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid backend environment configuration: ${issues}`);
}

const values = parsedEnv.data;
const corsAllowedOrigins = (values.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

if (values.NODE_ENV === "production" && corsAllowedOrigins.length === 0) {
  throw new Error(
    "Invalid backend environment configuration: CORS_ALLOWED_ORIGINS is required in production.",
  );
}

export const env = {
  nodeEnv: values.NODE_ENV,
  isProduction: values.NODE_ENV === "production",
  port: values.PORT,
  apiTimeoutMs: values.API_TIMEOUT_MS,
  corsAllowedOrigins,
  logLevel: values.LOG_LEVEL,
  supabaseUrl: values.SUPABASE_URL,
  supabaseAnonKey: values.SUPABASE_ANON_KEY,
  apiVersion: "v1",
  gitSha: values.GIT_SHA ?? values.RENDER_GIT_COMMIT ?? null,
} as const;
