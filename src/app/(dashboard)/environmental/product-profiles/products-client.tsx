"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNumber, formatPercent } from "@/lib/format";

type Product = {
  id: string;
  sku: string;
  productName: string;
  category: string | null;
  embodiedCarbon: string | number;
  recyclablePercentage: string | number;
  renewableMaterialPercentage: string | number;
  supplierEsgRating: string | null;
  status: string;
};

const columns: ColumnDef<Product>[] = [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "productName", header: "Product" },
  { accessorKey: "category", header: "Category", cell: ({ row }) => row.original.category ?? "—" },
  { accessorKey: "embodiedCarbon", header: "Embodied CO₂", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.embodiedCarbon)} kg</span> },
  { accessorKey: "recyclablePercentage", header: "Recyclable", cell: ({ row }) => <span className="tabular-nums">{formatPercent(row.original.recyclablePercentage)}</span> },
  { accessorKey: "renewableMaterialPercentage", header: "Renewable", cell: ({ row }) => <span className="tabular-nums">{formatPercent(row.original.renewableMaterialPercentage)}</span> },
  { accessorKey: "supplierEsgRating", header: "Supplier", cell: ({ row }) => row.original.supplierEsgRating ?? "—" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: FieldDef[] = [
  { name: "sku", label: "SKU", type: "text", required: true, half: true },
  { name: "productName", label: "Product name", type: "text", required: true, half: true },
  { name: "category", label: "Category", type: "text", half: true },
  { name: "supplierEsgRating", label: "Supplier ESG rating", type: "text", half: true, placeholder: "A / B / C" },
  { name: "embodiedCarbon", label: "Embodied carbon (kg)", type: "number", half: true },
  { name: "recyclablePercentage", label: "Recyclable %", type: "number", half: true },
  { name: "renewableMaterialPercentage", label: "Renewable material %", type: "number", half: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    half: true,
    defaultValue: "ACTIVE",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Inactive", value: "INACTIVE" },
      { label: "Archived", value: "ARCHIVED" },
    ],
  },
];

export function ProductsClient({ data, canManage }: { data: Product[]; canManage: boolean }) {
  return (
    <ResourceManager
      data={data}
      columns={columns}
      fields={fields}
      endpoint="/api/environmental/product-profiles"
      entityLabel="Product Profile"
      canManage={canManage}
      searchPlaceholder="Search products…"
      emptyMessage="No product profiles yet."
    />
  );
}
