"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { goalProgress } from "@/lib/esg/scoring";
import { formatDate, formatNumber, toNumber } from "@/lib/format";

type Goal = {
  id: string;
  name: string;
  department: { name: string } | null;
  departmentId: string | null;
  metric: string;
  baselineValue: string | number;
  targetValue: string | number;
  currentValue: string | number;
  unit: string;
  startDate: string | null;
  dueDate: string | null;
  status: string;
};

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "On Track", value: "ON_TRACK" },
  { label: "At Risk", value: "AT_RISK" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Overdue", value: "OVERDUE" },
];

const columns: ColumnDef<Goal>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "Org-wide" },
  { accessorKey: "targetValue", header: "Target", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.targetValue)} {row.original.unit}</span> },
  { accessorKey: "currentValue", header: "Current", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.currentValue)} {row.original.unit}</span> },
  {
    id: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const p = goalProgress(toNumber(row.original.currentValue), toNumber(row.original.baselineValue), toNumber(row.original.targetValue));
      return (
        <div className="flex w-36 items-center gap-2">
          <Progress value={p} className="h-2" />
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{Math.round(p)}%</span>
        </div>
      );
    },
  },
  { accessorKey: "dueDate", header: "Deadline", cell: ({ row }) => formatDate(row.original.dueDate) },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

export function GoalsClient({
  data,
  canManage,
  departments,
  autoOpen,
}: {
  data: Goal[];
  canManage: boolean;
  departments: { label: string; value: string }[];
  autoOpen?: boolean;
}) {
  const fields: FieldDef[] = [
    { name: "name", label: "Goal name", type: "text", required: true },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments, placeholder: "Org-wide" },
    { name: "metric", label: "Metric", type: "text", half: true, defaultValue: "CO2e" },
    { name: "baselineValue", label: "Baseline", type: "number", half: true },
    { name: "targetValue", label: "Target", type: "number", required: true, half: true },
    { name: "currentValue", label: "Current", type: "number", half: true },
    { name: "unit", label: "Unit", type: "text", half: true, defaultValue: "t" },
    { name: "startDate", label: "Start date", type: "date", half: true },
    { name: "dueDate", label: "Deadline", type: "date", half: true },
    { name: "status", label: "Status", type: "select", half: true, options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    { name: "description", label: "Description", type: "textarea" },
  ];

  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/environmental/goals"
      entityLabel="Goal"
      canManage={canManage}
      searchPlaceholder="Search goals…"
      emptyMessage="No environmental goals yet."
      autoOpenCreate={autoOpen}
      toFormValues={(row) => ({ ...row, departmentId: row.departmentId ?? "" })}
    />
  );
}
