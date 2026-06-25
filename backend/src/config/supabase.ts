import { createClient } from "@supabase/supabase-js";

import { env } from "./env.js";
import type { Database } from "../types/database.js";

export const createRequestScopedSupabaseClient = (accessToken?: string) => {
  const headers: Record<string, string> = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers },
  });
};
