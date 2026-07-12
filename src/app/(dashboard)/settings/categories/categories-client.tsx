"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";
import { EntityIcon, ENTITY_ICON_OPTIONS } from "@/components/shared/entity-icon";
import { humanizeEnum } from "@/lib/format";

type Category = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  icon: string | null;
  status: string;
};

const TYPES = [
  { label: "CSR Activity", value: "CSR_ACTIVITY" },
  { label: "Challenge", value: "CHALLENGE" },
  { label: "ESG", value: "ESG" },
  { label: "Training", value: "TRAINING" },
];
const STATUS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        <EntityIcon name={row.original.icon} fallback={Tag} className="size-4 shrink-0 text-muted-foreground" />
        {row.original.name}
      </span>
    ),
  },
  { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge variant="outline">{humanizeEnum(row.original.type)}</Badge> },
  { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description ?? "—" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true, half: true },
  { name: "type", label: "Type", type: "select", required: true, half: true, options: TYPES },
  { name: "icon", label: "Icon / logo", type: "select", half: true, options: ENTITY_ICON_OPTIONS, placeholder: "Default (Tag)" },
  { name: "status", label: "Status", type: "select", half: true, options: STATUS, defaultValue: "ACTIVE" },
  { name: "description", label: "Description", type: "textarea" },
];

export function CategoriesClient({ data, canManage }: { data: Category[]; canManage: boolean }) {
  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/settings/categories"
      entityLabel="Category"
      canManage={canManage}
      searchPlaceholder="Search categories…"
    />
  );
}
