"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeIcon, BADGE_ICON_OPTIONS, UNLOCK_METRIC_OPTIONS, badgeRule } from "../_lib/ui";

type Badge = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  unlockMetric: string;
  unlockThreshold: number;
  status: string;
  _count?: { employeeBadges: number };
};

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const fields: FieldDef[] = [
  { name: "name", label: "Badge name", type: "text", required: true },
  { name: "icon", label: "Icon", type: "select", half: true, options: BADGE_ICON_OPTIONS, defaultValue: "Award" },
  { name: "status", label: "Status", type: "select", half: true, options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
  { name: "unlockMetric", label: "Unlock metric", type: "select", half: true, options: UNLOCK_METRIC_OPTIONS, defaultValue: "TOTAL_XP" },
  { name: "unlockThreshold", label: "Threshold", type: "number", half: true, required: true },
  { name: "description", label: "Description", type: "textarea" },
];

const columns: ColumnDef<Badge>[] = [
  { accessorKey: "name", header: "Badge" },
  { id: "rule", header: "Unlock rule", cell: ({ row }) => badgeRule(row.original.unlockMetric, row.original.unlockThreshold) },
  { id: "earned", header: "Earned by", cell: ({ row }) => `${row.original._count?.employeeBadges ?? 0} employees` },
];

export function BadgesClient({ data, canManage }: { data: Badge[]; canManage: boolean }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((b) => (
          <Card key={b.id} className="gap-0 border-game/30 py-4">
            <CardContent className="flex items-start gap-3 px-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-game/10 text-game">
                <BadgeIcon name={b.icon} />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{b.name}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{b.description}</p>
                <p className="mt-1 text-xs font-medium text-game">{badgeRule(b.unlockMetric, b.unlockThreshold)}</p>
                <p className="text-[11px] text-muted-foreground">{b._count?.employeeBadges ?? 0} earned</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {canManage && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Manage badges</h2>
          <ResourceManager
            data={data}
            columns={columns}
            fields={fields}
            endpoint="/api/gamification/badges"
            entityLabel="Badge"
            canManage
            searchPlaceholder="Search badges…"
          />
        </div>
      )}
    </>
  );
}
