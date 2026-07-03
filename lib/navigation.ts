import {
  Archive,
  Briefcase,
  MessagesSquare,
  Scissors,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Applications", href: "/applications", icon: Briefcase },
  { label: "Tailor", href: "/tailor", icon: Scissors },
  { label: "Source", href: "/source", icon: Archive },
  { label: "Answers", href: "/answers", icon: MessagesSquare },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
