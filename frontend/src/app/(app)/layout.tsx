import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { VitalTrackApiClient } from "@/lib/api/client";
import { getServerSessionUser } from "@/lib/auth/session";

import { signOutAction } from "./actions";

const fallbackWorkspaceLabel = "Dentira workspace";

const getWorkspaceLabel = async (accessToken: string) => {
  try {
    const apiClient = new VitalTrackApiClient(accessToken);
    const facilities = await apiClient.listFacilities({
      isActive: true,
      limit: 1,
    });

    return facilities[0]?.name ?? fallbackWorkspaceLabel;
  } catch {
    return fallbackWorkspaceLabel;
  }
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    redirect("/sign-in");
  }

  const workspaceLabel = await getWorkspaceLabel(sessionUser.accessToken);

  return (
    <AppShell
      signOutAction={signOutAction}
      userEmail={sessionUser.user.email ?? "Signed-in user"}
      workspaceLabel={workspaceLabel}
    >
      {children}
    </AppShell>
  );
}
