"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, CheckCircle2, HandHeart, MapPin, Users } from "lucide-react";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber } from "@/lib/format";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  categoryId: string | null;
  departmentId: string | null;
  category: { name: string } | null;
  department: { name: string } | null;
  activityDate: string | null;
  registrationDeadline: string | null;
  capacity: number | null;
  points: number;
  evidenceRequired: boolean;
  status: string;
  _count: { participations: number };
};

type Option = { label: string; value: string };

const STATUS_OPTIONS: Option[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

const columns: ColumnDef<Activity>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "category", header: "Category", cell: ({ row }) => row.original.category?.name ?? "—" },
  { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "Org-wide" },
  { accessorKey: "activityDate", header: "Date", cell: ({ row }) => formatDate(row.original.activityDate) },
  { id: "joined", header: "Joined", cell: ({ row }) => <span className="tabular-nums">{row.original._count.participations}</span> },
  { accessorKey: "points", header: "Points", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.points, 0)}</span> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

export function ActivitiesClient({
  data,
  canManage,
  canJoin,
  joinedIds,
  categories,
  departments,
  autoOpen,
}: {
  data: Activity[];
  canManage: boolean;
  canJoin: boolean;
  joinedIds: string[];
  categories: Option[];
  departments: Option[];
  autoOpen?: boolean;
}) {
  const joined = new Set(joinedIds);

  const fields: FieldDef[] = [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Community tree plantation" },
    { name: "categoryId", label: "Category", type: "select", half: true, options: categories, placeholder: "Uncategorized" },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments, placeholder: "Org-wide" },
    { name: "location", label: "Location", type: "text", half: true, placeholder: "City / venue" },
    { name: "activityDate", label: "Activity date", type: "date", half: true },
    { name: "registrationDeadline", label: "Registration deadline", type: "date", half: true },
    { name: "capacity", label: "Capacity", type: "number", half: true, placeholder: "Max participants" },
    { name: "points", label: "Points", type: "number", half: true, defaultValue: 0 },
    { name: "status", label: "Status", type: "select", half: true, options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    { name: "evidenceRequired", label: "Evidence required", type: "switch", half: true, defaultValue: true, helper: "Require proof before approval." },
    { name: "description", label: "Description", type: "textarea" },
  ];

  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <EmptyState
          icon={HandHeart}
          title="No CSR activities yet"
          description={canManage ? "Create the first activity for employees to join." : "Check back soon for new initiatives to join."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((a) => {
            const hasJoined = joined.has(a.id);
            const full = a.capacity != null && a._count.participations >= a.capacity;
            return (
              <Card key={a.id} className="flex h-full flex-col">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-social/10 text-social">
                        <HandHeart className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-medium leading-tight">{a.title}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {a.category?.name ?? "Uncategorized"} · {a.department?.name ?? "Org-wide"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  {a.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {a._count.participations} joined
                    </span>
                    {a.activityDate && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" /> {formatDate(a.activityDate)}
                      </span>
                    )}
                    {a.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" /> {a.location}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{formatNumber(a.points, 0)} pts</Badge>
                    {a.evidenceRequired && <Badge variant="warning">Evidence Required</Badge>}
                  </div>

                  {canJoin && (
                    <div className="pt-1">
                      {hasJoined ? (
                        <Button size="sm" variant="outline" disabled className="w-full">
                          <CheckCircle2 className="size-4 text-success" /> Joined
                        </Button>
                      ) : (
                        <ActionButton
                          endpoint={`/api/social/activities/${a.id}/join`}
                          label={full ? "At capacity" : "Join"}
                          icon={HandHeart}
                          size="sm"
                          className="w-full"
                          disabled={full || a.status !== "ACTIVE"}
                          successMessage="Joined!"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {canManage && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Manage activities</h2>
          <ResourceManager
            data={data}
            columns={columns}
            fields={fields}
            endpoint="/api/social/activities"
            entityLabel="Activity"
            createLabel="New Activity"
            canManage={canManage}
            searchPlaceholder="Search activities…"
            emptyMessage="No CSR activities yet."
            autoOpenCreate={autoOpen}
            toFormValues={(row) => ({
              ...row,
              categoryId: row.categoryId ?? "",
              departmentId: row.departmentId ?? "",
            })}
          />
        </section>
      )}
    </div>
  );
}
