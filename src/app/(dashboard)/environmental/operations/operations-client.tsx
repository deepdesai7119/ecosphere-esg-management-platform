"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { formatCo2, formatDate, formatNumber, humanizeEnum } from "@/lib/format";

type Operation = {
  id: string;
  operationType: string;
  operationDate: string;
  department: { name: string } | null;
  departmentId: string | null;
  emissionFactor: { name: string; scope: string } | null;
  emissionFactorId: string | null;
  quantity: string | number;
  unit: string;
  amount: string | number | null;
  referenceNumber: string | null;
  carbonTransaction: { id: string; co2eKg: string | number } | null;
};

const OP_TYPES = [
  { label: "Purchase", value: "PURCHASE" },
  { label: "Manufacturing", value: "MANUFACTURING" },
  { label: "Expense", value: "EXPENSE" },
  { label: "Fleet", value: "FLEET" },
];

function GenerateItem({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <DropdownMenuItem
      onSelect={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          await api.post(`/api/environmental/operations/${id}/generate-transaction`);
          toast.success("Carbon transaction generated.");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <Zap className="size-4" /> {loading ? "Generating…" : "Generate transaction"}
    </DropdownMenuItem>
  );
}

const columns: ColumnDef<Operation>[] = [
  { accessorKey: "operationDate", header: "Date", cell: ({ row }) => formatDate(row.original.operationDate) },
  { accessorKey: "operationType", header: "Type", cell: ({ row }) => <Badge variant="outline">{humanizeEnum(row.original.operationType)}</Badge> },
  { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "—" },
  { accessorKey: "emissionFactor", header: "Factor", cell: ({ row }) => row.original.emissionFactor?.name ?? "—" },
  { id: "qty", header: "Quantity", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.quantity)} {row.original.unit}</span> },
  {
    id: "co2e",
    header: "CO₂e",
    cell: ({ row }) =>
      row.original.carbonTransaction ? (
        <span className="font-medium text-env tabular-nums">{formatCo2(row.original.carbonTransaction.co2eKg)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

export function OperationsClient({
  data,
  canManage,
  departments,
  factors,
  autoOpen,
  autoCalc,
}: {
  data: Operation[];
  canManage: boolean;
  departments: { label: string; value: string }[];
  factors: { label: string; value: string }[];
  autoOpen?: boolean;
  autoCalc: boolean;
}) {
  const fields: FieldDef[] = [
    { name: "operationType", label: "Operation type", type: "select", required: true, half: true, options: OP_TYPES },
    { name: "departmentId", label: "Department", type: "select", half: true, options: departments, placeholder: "Org-wide" },
    {
      name: "emissionFactorId",
      label: "Emission factor",
      type: "select",
      half: true,
      options: factors,
      helper: autoCalc ? "CO₂e auto-calculated on save." : "Auto-calc is off; generate manually.",
    },
    { name: "operationDate", label: "Operation date", type: "date", required: true, half: true },
    { name: "quantity", label: "Quantity", type: "number", required: true, half: true },
    { name: "unit", label: "Unit", type: "text", required: true, half: true, placeholder: "L, kWh, kg…" },
    { name: "amount", label: "Amount (optional)", type: "number", half: true },
    { name: "referenceNumber", label: "Reference no.", type: "text", half: true },
    { name: "description", label: "Description", type: "textarea" },
  ];

  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/environmental/operations"
      entityLabel="Operation"
      canManage={canManage}
      searchPlaceholder="Search operations…"
      emptyMessage="No business operations yet."
      autoOpenCreate={autoOpen}
      disableEdit
      rowActions={canManage ? (row) => <GenerateItem id={row.id} /> : undefined}
    />
  );
}
