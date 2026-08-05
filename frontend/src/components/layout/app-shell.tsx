import type { ReactNode } from "react";

import { NavLinks } from "@/components/layout/nav-links";
import { ShellHeader } from "@/components/layout/shell-header";

const getInitials = (email: string) => {
  const localPart = email.split("@")[0] || "user";
  const parts = localPart.split(/[._-]/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "VT";
};

export function AppShell({
  children,
  userEmail,
  workspaceLabel = "Project Lighthouse",
  signOutAction,
}: {
  children: ReactNode;
  userEmail: string;
  workspaceLabel?: string;
  signOutAction: string | (() => Promise<void>);
}) {
  const initials = getInitials(userEmail);

  return (
    <div
      className="min-h-screen bg-lighthouse-background text-slate-900 lg:h-screen lg:overflow-hidden"
      data-testid="app-shell"
    >
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <aside
          className="flex shrink-0 flex-col bg-lighthouse-primary text-white lg:w-[220px]"
          data-testid="app-sidebar"
        >
          <div className="border-b border-white/10 px-4 pb-4 pt-5">
            <div className="flex h-11 items-center justify-center rounded-lg bg-white/95 px-3 text-sm font-bold tracking-tight text-lighthouse-primary shadow-sm">
              VitalTrack
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Technologies
            </p>
          </div>

          <div
            className="flex-1 overflow-x-auto px-2.5 py-3 lg:overflow-y-auto"
            data-testid="app-navigation-scroll"
          >
            <NavLinks />
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lighthouse-accent text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  Signed in
                </p>
                <p className="truncate text-[11px] text-[#8BA7CC]">
                  {userEmail}
                </p>
              </div>
            </div>

            <form action={signOutAction} className="mt-3">
              <button
                type="submit"
                className="w-full rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <ShellHeader workspaceLabel={workspaceLabel} />
          <main
            className="min-w-0 flex-1 overflow-auto px-4 py-5 sm:px-6"
            data-testid="app-main"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
