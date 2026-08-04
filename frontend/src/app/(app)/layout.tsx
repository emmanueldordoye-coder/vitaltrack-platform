import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getServerSessionUser } from "@/lib/auth/session";

import { signOutAction } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    redirect("/sign-in");
  }

  return (
    <AppShell
      signOutAction={signOutAction}
      userEmail={sessionUser.user.email ?? "Signed-in user"}
    >
      {children}
    </AppShell>
  );
}
