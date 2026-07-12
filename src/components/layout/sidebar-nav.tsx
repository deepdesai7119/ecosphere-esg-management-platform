"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { navForRole, type NavGroup } from "@/config/nav";
import { MODULES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

function isGroupActive(group: NavGroup, pathname: string): boolean {
  if (group.items) {
    return group.items.some(
      (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
    );
  }
  return pathname === group.href;
}

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const groups = navForRole(role);

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-3">
      {groups.map((group) => {
        const active = isGroupActive(group, pathname);
        const accent = group.module ? MODULES[group.module].hex : undefined;

        if (!group.items) {
          return (
            <Link
              key={group.href}
              href={group.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white",
                active && "bg-white/10 text-white",
              )}
            >
              <group.icon className="size-4 shrink-0" style={active && accent ? { color: accent } : undefined} />
              {group.title}
            </Link>
          );
        }

        return (
          <Collapsible key={group.href} defaultOpen={active}>
            <CollapsibleTrigger
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white",
                active && "text-white",
              )}
            >
              <group.icon
                className="size-4 shrink-0"
                style={accent ? { color: accent } : undefined}
              />
              <span className="flex-1 text-left">{group.title}</span>
              <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-0.5 space-y-0.5 pl-3">
              {group.items.map((item) => {
                const itemActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md border-l-2 border-transparent py-1.5 pr-2 pl-3 text-[13px] text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
                      itemActive && "bg-white/10 font-medium text-white",
                    )}
                    style={itemActive && accent ? { borderColor: accent } : undefined}
                  >
                    <item.icon className="size-3.5 shrink-0" />
                    {item.title}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}
