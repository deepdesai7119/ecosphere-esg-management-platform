"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";

type Policy = {
  id: string;
  title: string;
  code: string;
  version: string;
  status: string;
  description: string | null;
  departmentId: string | null;
  effectiveDate: string | null;
  acknowledgementDueDate: string | null;
  acknowledgementRequired: boolean;
  department: { name: string } | null;
};

const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
];

const columns: ColumnDef<Policy>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "code", header: "Code" },
  { accessorKey: "version", header: "Version", cell: ({ row }) => <span className="tabular-nums">{row.original.version}</span> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "effectiveDate", header: "Effective", cell: ({ row }) => formatDate(row.original.effectiveDate) },
  { accessorKey: "acknowledgementDueDate", header: "Ack. due", cell: ({ row }) => formatDate(row.original.acknowledgementDueDate) },
];

export function PoliciesClient({
  data,
  canManage,
  departments,
}: {
  data: Policy[];
  canManage: boolean;
  departments: { label: string; value: string }[];
}) {
  const fields: FieldDef[] = [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Anti-bribery policy" },
    { name: "code", label: "Code", type: "text", required: true, half: true, placeholder: "e.g. GOV-001" },
    { name: "version", label: "Version", type: "text", half: true, defaultValue: "1.0" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Summary of the policy…" },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments, placeholder: "Org-wide" },
    { name: "status", label: "Status", type: "select", half: true, options: STATUS_OPTIONS, defaultValue: "DRAFT" },
    { name: "effectiveDate", label: "Effective date", type: "date", half: true },
    { name: "acknowledgementDueDate", label: "Acknowledgement due", type: "date", half: true },
    {
      name: "acknowledgementRequired",
      label: "Requires acknowledgement",
      type: "switch",
      defaultValue: true,
      helper: "When published with this on, all employees receive an acknowledgement request.",
    },
  ];

  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/governance/policies"
      entityLabel="Policy"
      canManage={canManage}
      searchPlaceholder="Search policies…"
      emptyMessage="No policies yet."
    />
  );
}
