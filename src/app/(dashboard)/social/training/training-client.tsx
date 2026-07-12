"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2 } from "lucide-react";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type Training = {
  id: string;
  title: string;
  description: string | null;
  departmentId: string | null;
  department: { name: string } | null;
  dueDate: string | null;
  status: string;
  _count: { completions: number };
};

type Option = { label: string; value: string };

const STATUS_OPTIONS: Option[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

export function TrainingClient({
  data,
  canManage,
  completedIds,
  departments,
  autoOpen,
}: {
  data: Training[];
  canManage: boolean;
  completedIds: string[];
  departments: Option[];
  autoOpen?: boolean;
}) {
  const completed = new Set(completedIds);

  const columns: ColumnDef<Training>[] = [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "Org-wide" },
    { accessorKey: "dueDate", header: "Due", cell: ({ row }) => formatDate(row.original.dueDate) },
    { id: "completions", header: "Completions", cell: ({ row }) => <span className="tabular-nums">{row.original._count.completions}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: "complete",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        completed.has(row.original.id) ? (
          <Badge variant="success">
            <CheckCircle2 className="size-3" /> Completed
          </Badge>
        ) : (
          <ActionButton
            endpoint={`/api/social/training/${row.original.id}/complete`}
            label="Mark complete"
            icon={CheckCircle2}
            variant="outline"
            size="sm"
            successMessage="Training completed!"
          />
        ),
    },
  ];

  const fields: FieldDef[] = [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Workplace safety 101" },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments, placeholder: "Org-wide" },
    { name: "dueDate", label: "Due date", type: "date", half: true },
    { name: "status", label: "Status", type: "select", half: true, options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    { name: "description", label: "Description", type: "textarea" },
  ];

  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/social/training"
      entityLabel="Training"
      createLabel="New Training"
      canManage={canManage}
      searchPlaceholder="Search trainings…"
      emptyMessage="No trainings yet."
      autoOpenCreate={autoOpen}
      toFormValues={(row) => ({ ...row, departmentId: row.departmentId ?? "" })}
    />
  );
}
