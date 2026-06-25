import { redirect } from "next/navigation";

import { getServerSessionUser } from "@/lib/auth/session";
import { VitalTrackApiClient } from "@/lib/api/client";

export const createServerApiClient = async () => {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    redirect("/sign-in");
  }

  return new VitalTrackApiClient(sessionUser.accessToken);
};
