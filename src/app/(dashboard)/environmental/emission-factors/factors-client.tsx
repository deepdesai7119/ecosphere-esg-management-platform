"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";
import { SCOPE_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

type Factor = {
  id: string;
  name: string;
  sourceType: string;
  activityUnit: string;
  factorValue: string | number;
  emissionUnit: string;
  scope: string;
  region: string | null;
  status: string;
};

const SCOPE_OPTIONS = [
  { label: "Scope 1 · Direct", value: "SCOPE_1" },
  { label: "Scope 2 · Energy", value: "SCOPE_2" },
  { label: "Scope 3 · Value chain", value: "SCOPE_3" },
];
const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

const columns: ColumnDef<Factor>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "sourceType", header: "Source" },
  { accessorKey: "scope", header: "Scope", cell: ({ row }) => <span className="text-sm">{SCOPE_LABELS[row.original.scope] ?? row.original.scope}</span> },
  {
    accessorKey: "factorValue",
    header: "Factor",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNumber(row.original.factorValue, 4)} {row.original.emissionUnit}/{row.original.activityUnit}
      </span>
    ),
  },
  { accessorKey: "region", header: "Region", cell: ({ row }) => row.original.region ?? "—" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Diesel (mobile combustion)" },
  { name: "sourceType", label: "Source type", type: "text", required: true, half: true, placeholder: "Fleet / Energy…" },
  { name: "scope", label: "Scope", type: "select", required: true, half: true, options: SCOPE_OPTIONS },
  { name: "activityUnit", label: "Activity unit", type: "text", required: true, half: true, placeholder: "L, kWh, kg…" },
  { name: "factorValue", label: "Factor value", type: "number", required: true, half: true, placeholder: "kgCO2e per unit" },
  { name: "emissionUnit", label: "Emission unit", type: "text", half: true, defaultValue: "kgCO2e" },
  { name: "region", label: "Region", type: "text", half: true, placeholder: "IN / Global" },
  { name: "referenceYear", label: "Reference year", type: "number", half: true, placeholder: "2025" },
  { name: "sourceReference", label: "Source reference", type: "text", placeholder: "DEFRA / IPCC…" },
  { name: "status", label: "Status", type: "select", half: true, options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
];

export function FactorsClient({ data, canManage }: { data: Factor[]; canManage: boolean }) {
  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/environmental/emission-factors"
      entityLabel="Emission Factor"
      canManage={canManage}
      searchPlaceholder="Search factors…"
      emptyMessage="No emission factors yet."
    />
  );
}
