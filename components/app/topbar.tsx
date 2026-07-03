"use client";

import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";

export function Topbar() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find(({ href }) => isNavItemActive(pathname, href));

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-line bg-surface px-4 md:px-8">
      <h1 className="text-lg font-medium text-ink">
        {current?.label ?? "Tailens"}
      </h1>
    </header>
  );
}
