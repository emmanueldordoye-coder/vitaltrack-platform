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
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return null;
  }

  return {
    user,
    accessToken: session.access_token,
  };
};
