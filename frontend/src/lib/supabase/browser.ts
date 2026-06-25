"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

let cachedClient: SupabaseClient | undefined;

export const createSupabaseBrowserClient = () => {
  if (!cachedClient) {
    cachedClient = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }

  return cachedClient;
};
