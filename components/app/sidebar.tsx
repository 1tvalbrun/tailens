"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <aside className="sticky top-0 flex h-dvh w-16 shrink-0 flex-col bg-sidebar md:w-60">
        <div className="flex h-14 items-center justify-center gap-2.5 md:justify-start md:px-5">
          <span aria-hidden className="size-2.5 rounded-full bg-accent" />
          <span className="hidden font-display text-base font-semibold text-sidebar-active md:block">
            tailens
          </span>
        </div>

        <nav aria-label="Primary" className="flex-1 px-2.5 py-4 md:px-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = isNavItemActive(pathname, href);
              return (
                <li key={href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-center gap-3 rounded-lg p-2.5 text-sm font-medium transition-colors md:justify-start md:px-3",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                          active
                            ? "bg-sidebar-raised text-sidebar-active"
                            : "text-sidebar-text hover:bg-sidebar-raised hover:text-sidebar-active",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                        <span className="sr-only md:not-sr-only">{label}</span>
                      </Link>
                    </TooltipTrigger>
                    {/* Labels are visible at md+; the tooltip only serves the icon rail. */}
                    <TooltipContent side="right" className="md:hidden">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        <Separator className="bg-sidebar-raised" />
        <div className="flex h-16 items-center justify-center md:justify-start md:px-5">
          <UserButton />
        </div>
      </aside>
    </TooltipProvider>
  );
}
