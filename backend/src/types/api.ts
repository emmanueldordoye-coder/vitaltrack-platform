import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "./database.js";

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
  meta: ApiResponseMeta;
}

export interface RequestContext {
  requestId: string;
  accessToken?: string;
  user?: User;
  supabase: SupabaseClient<Database>;
  validated?: {
    body?: unknown;
    params?: unknown;
    query?: unknown;
  };
}
