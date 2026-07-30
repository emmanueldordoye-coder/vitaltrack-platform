import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/contracts";

export const getServerSessionUser = async (): Promise<SessionUser | null> => {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  return {
    user,
    accessToken: session.access_token,
  };
};
