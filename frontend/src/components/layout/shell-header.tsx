"use client";

import { usePathname } from "next/navigation";

import { getRouteLabel } from "@/components/layout/routes";

export const ShellHeader = () => {
  const pathname = usePathname();
  const label = getRouteLabel(pathname);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 sm:px-5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Operations</span>
          <span aria-hidden="true">/</span>
          <span className="truncate font-semibold text-slate-800">{label}</span>
        </div>
      </div>
      <div className="hidden text-xs font-medium text-lighthouse-primary sm:block">
        Project Lighthouse
      </div>
    </header>
  );
};
