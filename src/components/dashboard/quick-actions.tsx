import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Factory,
  Target,
  HandHeart,
  Flag,
  ClipboardCheck,
  ShieldAlert,
  FileBarChart,
  ListTodo,
  Trophy,
  Gift,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface Action {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

const MANAGER_ACTIONS: Action[] = [
  { label: "Log operation", href: "/environmental/operations?new=1", icon: Factory, color: "text-env" },
  { label: "Add goal", href: "/environmental/goals?new=1", icon: Target, color: "text-env" },
  { label: "New CSR activity", href: "/social/activities?new=1", icon: HandHeart, color: "text-social" },
  { label: "New challenge", href: "/gamification/challenges?new=1", icon: Flag, color: "text-game" },
  { label: "Add audit", href: "/governance/audits?new=1", icon: ClipboardCheck, color: "text-gov" },
  { label: "Raise issue", href: "/governance/compliance?new=1", icon: ShieldAlert, color: "text-gov" },
  { label: "Generate report", href: "/reports/esg-summary", icon: FileBarChart, color: "text-foreground" },
];

const EMPLOYEE_ACTIONS: Action[] = [
  { label: "My work", href: "/my-work", icon: ListTodo, color: "text-foreground" },
  { label: "Join challenge", href: "/gamification/challenges", icon: Flag, color: "text-game" },
  { label: "CSR activities", href: "/social/activities", icon: HandHeart, color: "text-social" },
  { label: "Leaderboard", href: "/gamification/leaderboard", icon: Trophy, color: "text-game" },
  { label: "Redeem rewards", href: "/gamification/rewards", icon: Gift, color: "text-game" },
];

export function QuickActions({ role }: { role: Role }) {
  const actions =
    role === "EMPLOYEE" || role === "AUDITOR" ? EMPLOYEE_ACTIONS : MANAGER_ACTIONS;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-start gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/60"
          >
            <a.icon className={cn("size-4", a.color)} />
            <span className="text-xs font-medium">{a.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
