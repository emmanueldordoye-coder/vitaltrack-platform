"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { supportedNavigation } from "@/components/layout/routes";
import { cn } from "@/lib/utils";

export const NavLinks = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary">
      <ul className="flex gap-1 lg:block lg:space-y-1" data-testid="primary-navigation-list">
        {supportedNavigation.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <li className="min-w-max lg:min-w-0" key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                  "text-[#8BA7CC] hover:bg-white/10 hover:text-white",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  isActive && "bg-white/15 text-white shadow-sm",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
