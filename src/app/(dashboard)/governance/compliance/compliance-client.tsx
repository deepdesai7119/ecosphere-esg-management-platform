"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ShieldAlert } from "lucide-react";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type Issue = {
  id: string;
  title: string;
  severity: string;
  status: string;
  isOverdue: boolean;
  dueDate: string | null;
  department: { name: string } | null;
  departmentId: string | null;
  owner: { name: string } | null;
  ownerId: string | null;
  auditId: string | null;
};

const SEVERITY = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];
const STATUS = [
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

const columns: ColumnDef<Issue>[] = [
  { accessorKey: "title", header: "Issue" },
  { accessorKey: "severity", header: "Severity", cell: ({ row }) => <StatusBadge status={row.original.severity} /> },
  { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "—" },
  { accessorKey: "owner", header: "Owner", cell: ({ row }) => row.original.owner?.name ?? "—" },
  { accessorKey: "dueDate", header: "Due", cell: ({ row }) => formatDate(row.original.dueDate) },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <StatusBadge status={row.original.status} />
        {row.original.isOverdue && <Badge variant="destructive">Overdue</Badge>}
      </div>
    ),
  },
];

export function ComplianceClient({
  data,
  canManage,
  users,
  departments,
  audits,
}: {
  data: Issue[];
  canManage: boolean;
  users: { label: string; value: string }[];
  departments: { label: string; value: string }[];
  audits: { label: string; value: string }[];
}) {
  const fields: FieldDef[] = [
    { name: "title", label: "Issue title", type: "text", required: true },
    { name: "severity", label: "Severity", type: "select", required: true, half: true, options: SEVERITY },
    { name: "status", label: "Status", type: "select", half: true, options: STATUS, defaultValue: "OPEN" },
    { name: "ownerId", label: "Owner", type: "select", required: true, half: true, options: users },
    { name: "dueDate", label: "Due date", type: "date", required: true, half: true },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments },
    { name: "auditId", label: "Linked audit", type: "select", half: true, options: audits },
    { name: "description", label: "Description", type: "textarea" },
    { name: "resolutionNotes", label: "Resolution notes", type: "textarea" },
  ];

  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/governance/compliance"
      entityLabel="Compliance Issue"
      canManage={canManage}
      searchPlaceholder="Search issues…"
      emptyMessage="No compliance issues."
      toFormValues={(row) => ({
        ...row,
        ownerId: row.ownerId ?? "",
        departmentId: row.departmentId ?? "",
        auditId: row.auditId ?? "",
      })}
      extraToolbar={
        canManage ? (
          <ActionButton
            endpoint="/api/jobs/check-overdue-compliance"
            label="Run compliance check"
            icon={ShieldAlert}
            variant="outline"
            successMessage="Overdue sweep complete."
          />
        ) : undefined
      }
    />
  );
}
