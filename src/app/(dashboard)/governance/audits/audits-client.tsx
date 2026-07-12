"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber, humanizeEnum } from "@/lib/format";

type Audit = {
  id: string;
  title: string;
  description: string | null;
  auditType: string;
  auditorId: string | null;
  departmentId: string | null;
  auditDate: string | null;
  findingsSummary: string | null;
  score: string | number | null;
  status: string;
  department: { name: string } | null;
  auditor: { name: string } | null;
  _count: { issues: number };
};

const TYPE_OPTIONS = [
  { label: "Internal", value: "INTERNAL" },
  { label: "External", value: "EXTERNAL" },
  { label: "Vendor", value: "VENDOR" },
  { label: "Regulatory", value: "REGULATORY" },
];
const STATUS_OPTIONS = [
  { label: "Planned", value: "PLANNED" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Under review", value: "UNDER_REVIEW" },
  { label: "Completed", value: "COMPLETED" },
];

const columns: ColumnDef<Audit>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "auditType", header: "Type", cell: ({ row }) => <Badge variant="outline">{humanizeEnum(row.original.auditType)}</Badge> },
  { accessorKey: "auditor", header: "Auditor", cell: ({ row }) => row.original.auditor?.name ?? "—" },
  { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "—" },
  { accessorKey: "auditDate", header: "Date", cell: ({ row }) => formatDate(row.original.auditDate) },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) =>
      row.original.score == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="tabular-nums">{formatNumber(row.original.score, 1)}</span>
      ),
  },
  { id: "issues", header: "Issues", cell: ({ row }) => <span className="tabular-nums">{row.original._count.issues}</span> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

export function AuditsClient({
  data,
  canManage,
  users,
  departments,
}: {
  data: Audit[];
  canManage: boolean;
  users: { label: string; value: string }[];
  departments: { label: string; value: string }[];
}) {
  const fields: FieldDef[] = [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Q3 vendor compliance audit" },
    { name: "auditType", label: "Type", type: "select", required: true, half: true, options: TYPE_OPTIONS, defaultValue: "INTERNAL" },
    { name: "status", label: "Status", type: "select", half: true, options: STATUS_OPTIONS, defaultValue: "PLANNED" },
    { name: "auditorId", label: "Auditor", type: "select", half: true, options: users, placeholder: "Unassigned" },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments, placeholder: "Org-wide" },
    { name: "auditDate", label: "Audit date", type: "date", half: true },
    { name: "score", label: "Score (0–100)", type: "number", half: true, placeholder: "e.g. 82" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Scope and objectives…" },
    { name: "findingsSummary", label: "Findings summary", type: "textarea", placeholder: "Key findings…" },
  ];

  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/governance/audits"
      entityLabel="Audit"
      canManage={canManage}
      searchPlaceholder="Search audits…"
      emptyMessage="No audits yet."
    />
  );
}
