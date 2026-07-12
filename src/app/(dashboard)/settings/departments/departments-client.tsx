"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";

type Dept = {
  id: string;
  name: string;
  code: string;
  head: { name: string } | null;
  headUserId: string | null;
  parent: { name: string } | null;
  parentDepartmentId: string | null;
  employeeCount: number;
  status: string;
  _count?: { members: number };
};

const STATUS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

const columns: ColumnDef<Dept>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "code", header: "Code" },
  { accessorKey: "head", header: "Head", cell: ({ row }) => row.original.head?.name ?? "—" },
  { accessorKey: "parent", header: "Parent", cell: ({ row }) => row.original.parent?.name ?? "—" },
  { accessorKey: "employeeCount", header: "Employees", cell: ({ row }) => <span className="tabular-nums">{row.original.employeeCount}</span> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

export function DepartmentsClient({
  data,
  canManage,
  users,
  departments,
}: {
  data: Dept[];
  canManage: boolean;
  users: { label: string; value: string }[];
  departments: { label: string; value: string }[];
}) {
  const fields: FieldDef[] = [
    { name: "name", label: "Name", type: "text", required: true, half: true },
    { name: "code", label: "Code", type: "text", required: true, half: true },
    { name: "headUserId", label: "Department head", type: "select", half: true, options: users },
    { name: "parentDepartmentId", label: "Parent department", type: "select", half: true, options: departments },
    { name: "employeeCount", label: "Employee count", type: "number", half: true },
    { name: "status", label: "Status", type: "select", half: true, options: STATUS, defaultValue: "ACTIVE" },
  ];

  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/settings/departments"
      entityLabel="Department"
      canManage={canManage}
      searchPlaceholder="Search departments…"
      toFormValues={(row) => ({ ...row, headUserId: row.headUserId ?? "", parentDepartmentId: row.parentDepartmentId ?? "" })}
    />
  );
}
