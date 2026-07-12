"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, ChevronRight, Flag } from "lucide-react";
import { toast } from "sonner";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { nextStatuses } from "@/lib/esg/challengeLifecycle";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_OPTIONS,
  DifficultyBadge,
  CHALLENGE_STATUS_OPTIONS,
  LIFECYCLE_STAGES,
} from "../_lib/ui";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  xp: number;
  difficulty: string;
  status: string;
  deadline: string | null;
  categoryId: string | null;
  departmentId: string | null;
  evidenceRequired: boolean;
  category?: { name: string } | null;
  _count?: { participations: number };
};

function Pipeline() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5">
      {LIFECYCLE_STAGES.map((s, i) => (
        <div key={s.value} className="flex items-center gap-1.5">
          <Badge variant="outline" className="font-medium">{s.label}</Badge>
          {i < LIFECYCLE_STAGES.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

function StatusTransitions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const options = nextStatuses(status as never);
  if (options.length === 0) return null;
  return (
    <>
      {options.map((s) => (
        <DropdownMenuItem
          key={s}
          onSelect={async (e) => {
            e.preventDefault();
            try {
              await api.post(`/api/gamification/challenges/${id}/status`, { status: s });
              toast.success(`Moved to ${s.replace(/_/g, " ").toLowerCase()}.`);
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed.");
            }
          }}
        >
          <Flag className="size-4" /> Move to {s.replace(/_/g, " ").toLowerCase()}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function ChallengesClient({
  data,
  canManage,
  canJoin,
  joinedIds,
  categories,
  departments,
  autoOpen,
}: {
  data: Challenge[];
  canManage: boolean;
  canJoin: boolean;
  joinedIds: string[];
  categories: { label: string; value: string }[];
  departments: { label: string; value: string }[];
  autoOpen?: boolean;
}) {
  const [joined] = useState(new Set(joinedIds));

  const fields: FieldDef[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "xp", label: "XP reward", type: "number", required: true, half: true, defaultValue: 100 },
    { name: "difficulty", label: "Difficulty", type: "select", half: true, options: DIFFICULTY_OPTIONS, defaultValue: "MEDIUM" },
    { name: "categoryId", label: "Category", type: "select", half: true, options: categories },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments },
    { name: "startDate", label: "Start date", type: "date", half: true },
    { name: "deadline", label: "Deadline", type: "date", half: true },
    { name: "status", label: "Status", type: "select", half: true, options: CHALLENGE_STATUS_OPTIONS, defaultValue: "DRAFT" },
    { name: "evidenceRequired", label: "Evidence required", type: "switch", half: true, defaultValue: true },
    { name: "description", label: "Description", type: "textarea" },
  ];

  const columns: ColumnDef<Challenge>[] = [
    { accessorKey: "title", header: "Challenge" },
    { accessorKey: "xp", header: "XP", cell: ({ row }) => <span className="tabular-nums">{row.original.xp}</span> },
    { accessorKey: "difficulty", header: "Difficulty", cell: ({ row }) => <DifficultyBadge difficulty={row.original.difficulty} /> },
    { id: "joins", header: "Joins", cell: ({ row }) => row.original._count?.participations ?? 0 },
    { accessorKey: "deadline", header: "Deadline", cell: ({ row }) => formatDate(row.original.deadline) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  return (
    <>
      <Pipeline />

      {/* Challenge cards */}
      {data.length === 0 ? (
        <EmptyState icon={Flag} title="No challenges yet" description="Create a challenge to engage employees." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => {
            const isJoined = joined.has(c.id);
            return (
              <Card key={c.id} className={cn("gap-0 border-game/30 py-4")}>
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Flag className="size-4 text-game" />
                      <span className="font-semibold">{c.title}</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-game">{c.xp} XP</span>
                    <DifficultyBadge difficulty={c.difficulty} />
                    {c.deadline && (
                      <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDate(c.deadline)}</span>
                    )}
                  </div>
                  <div className="pt-1">
                    {isJoined ? (
                      <Badge variant="success">Joined</Badge>
                    ) : canJoin && c.status === "ACTIVE" ? (
                      <ActionButton
                        endpoint={`/api/gamification/challenges/${c.id}/join`}
                        label="Join Challenge"
                        icon={Flag}
                        className="bg-game text-white hover:bg-game/90"
                        successMessage="Joined challenge!"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{c.status === "ACTIVE" ? "Open" : "Not open"}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Manager table */}
      {canManage && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Manage challenges</h2>
          <ResourceManager
            data={data}
            columns={columns}
            fields={fields}
            endpoint="/api/gamification/challenges"
            entityLabel="Challenge"
            canManage
            searchPlaceholder="Search challenges…"
            autoOpenCreate={autoOpen}
            toFormValues={(row) => ({
              ...row,
              categoryId: row.categoryId ?? "",
              departmentId: row.departmentId ?? "",
            })}
            rowActions={(row) => <StatusTransitions id={row.id} status={row.status} />}
          />
        </div>
      )}
    </>
  );
}
