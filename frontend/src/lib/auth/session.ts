import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/contracts";

export const getServerSessionUser = async (): Promise<SessionUser | null> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user || !session.access_token) {
    return null;
  }

  return {
    user: session.user,
    accessToken: session.access_token,
  };
};
