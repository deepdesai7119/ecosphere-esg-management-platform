"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api-client";
import { ROLE_LABELS } from "@/lib/constants";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: { name: string } | null;
  departmentId: string | null;
};

const ROLES = [
  { label: "Organisation Admin", value: "ORG_ADMIN" },
  { label: "ESG Manager", value: "ESG_MANAGER" },
  { label: "Department Head", value: "DEPARTMENT_HEAD" },
  { label: "Employee", value: "EMPLOYEE" },
  { label: "Auditor", value: "AUDITOR" },
];
const STATUS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

function ResetPasswordItem({ id }: { id: string }) {
  return (
    <DropdownMenuItem
      onSelect={async (e) => {
        e.preventDefault();
        try {
          const res = await api.post<{ tempPassword: string }>(`/api/settings/users/${id}/reset-password`);
          toast.success(`Password reset to ${res.tempPassword}`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed.");
        }
      }}
    >
      <KeyRound className="size-4" /> Reset password
    </DropdownMenuItem>
  );
}

const columns: ColumnDef<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role", cell: ({ row }) => ROLE_LABELS[row.original.role] ?? row.original.role },
  { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "—" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

export function UsersClient({
  data,
  canManage,
  departments,
}: {
  data: User[];
  canManage: boolean;
  departments: { label: string; value: string }[];
}) {
  const fields: FieldDef[] = [
    { name: "name", label: "Full name", type: "text", required: true, half: true },
    { name: "email", label: "Email", type: "text", required: true, half: true },
    { name: "role", label: "Role", type: "select", required: true, half: true, options: ROLES, defaultValue: "EMPLOYEE" },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments },
    { name: "password", label: "Password", type: "text", half: true, helper: "Defaults to Demo@123 if blank." },
    { name: "status", label: "Status", type: "select", half: true, options: STATUS, defaultValue: "ACTIVE" },
  ];

  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/settings/users"
      entityLabel="User"
      canManage={canManage}
      searchPlaceholder="Search users…"
      toFormValues={(row) => ({ ...row, departmentId: row.departmentId ?? "", password: "" })}
      rowActions={canManage ? (row) => <ResetPasswordItem id={row.id} /> : undefined}
    />
  );
}
