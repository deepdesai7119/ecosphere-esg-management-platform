"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Info, Check } from "lucide-react";
import { pageInfoFor } from "@/config/page-info";
import { can } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Info icon next to page titles. Explains what the page is for and lists only
 * the actions the current user's role can actually perform here.
 */
export function PageInfo() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const entry = pageInfoFor(pathname);

  if (!entry || !role) return null;

  const allowed = entry.actions.filter(
    (a) => !a.capability || can(role, a.capability),
  );

  return (
    <Popover>
      <PopoverTrigger
        aria-label="What you can do on this page"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <Info className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverHeader>
          <PopoverTitle className="flex items-center justify-between gap-2">
            About this page
            <Badge variant="secondary">{ROLE_LABELS[role] ?? role}</Badge>
          </PopoverTitle>
          <PopoverDescription>{entry.about}</PopoverDescription>
        </PopoverHeader>
        {allowed.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              As {ROLE_LABELS[role] ?? role}, you can:
            </p>
            <ul className="space-y-1">
              {allowed.map((a) => (
                <li key={a.label} className="flex items-start gap-1.5 text-xs">
                  <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                  <span>{a.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Your role has view-only access to this page.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
