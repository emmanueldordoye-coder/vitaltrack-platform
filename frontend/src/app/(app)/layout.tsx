import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { NavLinks } from "@/components/layout/nav-links";
import { getServerSessionUser } from "@/lib/auth/session";

import { signOutAction } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">VitalTrack</h2>
            <p className="mt-1 text-xs text-slate-500">{sessionUser.user.email}</p>
          </div>
          <NavLinks />
          <form action={signOutAction} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </form>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
