"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { navForRole } from "@/config/nav";
import { MODULES, type ModuleKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ModuleTabs({ groupHref, module }: { groupHref: string; module?: ModuleKey }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  if (!role) return null;
  const group = navForRole(role).find((g) => g.href === groupHref);
  if (!group?.items) return null;
  const accent = module ? MODULES[module].hex : undefined;

  return (
    <div className="mb-6 overflow-x-auto border-b">
      <nav className="flex min-w-max gap-1">
        {group.items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                active && "text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.title}
              {active && (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                  style={{ background: accent ?? "var(--color-primary)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
