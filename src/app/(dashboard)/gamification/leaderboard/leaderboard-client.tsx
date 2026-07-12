"use client";

import { useMemo, useState } from "react";
import { Crown, Medal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  department: string;
  totalXp: number;
  completedChallengeCount: number;
  badges: number;
  csr: number;
};

export function LeaderboardClient({
  rows,
  departments,
}: {
  rows: Row[];
  departments: { label: string; value: string }[];
}) {
  const [dept, setDept] = useState("all");
  const filtered = useMemo(
    () => (dept === "all" ? rows : rows.filter((r) => r.department === dept)),
    [rows, dept],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.value} value={d.label}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Rank</th>
              <th className="px-4 py-2.5 text-left font-medium">Employee</th>
              <th className="px-4 py-2.5 text-left font-medium">Department</th>
              <th className="px-4 py-2.5 text-right font-medium">XP</th>
              <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Challenges</th>
              <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">CSR</th>
              <th className="px-4 py-2.5 text-right font-medium">Badges</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r, i) => (
              <tr key={r.id} className={cn(i < 3 && "bg-game/5")}>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                    {i === 0 ? <Crown className="size-4 text-game" /> : i < 3 ? <Medal className="size-4 text-game" /> : null}
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7"><AvatarFallback className="bg-game/15 text-[10px] font-semibold text-game">{initials(r.name)}</AvatarFallback></Avatar>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.department}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-game">{formatNumber(r.totalXp, 0)}</td>
                <td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">{r.completedChallengeCount}</td>
                <td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">{r.csr}</td>
                <td className="px-4 py-2.5 text-right">
                  <Badge variant="secondary">{r.badges}</Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
