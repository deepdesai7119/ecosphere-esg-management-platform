"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Coins, Gift } from "lucide-react";
import { ResourceManager, type FieldDef } from "@/components/shared/resource-manager";
import { ActionButton } from "@/components/shared/action-button";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/format";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  pointsRequired: number;
  stock: number;
  status: string;
};

type Redemption = {
  id: string;
  status: string;
  pointsUsed: number;
  redeemedAt: string;
  reward: { name: string };
  employee: { name: string };
};

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const fields: FieldDef[] = [
  { name: "name", label: "Reward name", type: "text", required: true },
  { name: "pointsRequired", label: "Points required", type: "number", required: true, half: true },
  { name: "stock", label: "Stock", type: "number", required: true, half: true },
  { name: "status", label: "Status", type: "select", half: true, options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
  { name: "description", label: "Description", type: "textarea" },
];

const manageColumns: ColumnDef<Reward>[] = [
  { accessorKey: "name", header: "Reward" },
  { accessorKey: "pointsRequired", header: "Points", cell: ({ row }) => <span className="tabular-nums">{row.original.pointsRequired}</span> },
  { accessorKey: "stock", header: "Stock", cell: ({ row }) => <span className="tabular-nums">{row.original.stock}</span> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

function RedemptionActions({ id, status }: { id: string; status: string }) {
  const base = `/api/gamification/redemptions/${id}/process`;
  if (status === "PENDING") {
    return (
      <div className="flex gap-1.5">
        <ActionButton endpoint={base} body={{ status: "APPROVED" }} label="Approve" variant="outline" successMessage="Approved." />
        <ActionButton endpoint={base} body={{ status: "REJECTED" }} label="Reject" variant="outline" successMessage="Rejected." />
      </div>
    );
  }
  if (status === "APPROVED") {
    return <ActionButton endpoint={base} body={{ status: "FULFILLED" }} label="Mark fulfilled" variant="outline" successMessage="Fulfilled." />;
  }
  return null;
}

export function RewardsClient({
  rewards,
  availablePoints,
  canManage,
  canRedeem,
  redemptions,
}: {
  rewards: Reward[];
  availablePoints: number;
  canManage: boolean;
  canRedeem: boolean;
  redemptions: Redemption[];
}) {
  const redemptionColumns: ColumnDef<Redemption>[] = [
    { id: "employee", header: "Employee", accessorFn: (r) => r.employee.name },
    { id: "reward", header: "Reward", accessorFn: (r) => r.reward.name },
    { accessorKey: "pointsUsed", header: "Points", cell: ({ row }) => <span className="tabular-nums">{row.original.pointsUsed}</span> },
    { accessorKey: "redeemedAt", header: "Requested", cell: ({ row }) => formatDate(row.original.redeemedAt) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: "actions", header: "", cell: ({ row }) => <RedemptionActions id={row.original.id} status={row.original.status} /> },
  ];

  return (
    <>
      {canRedeem && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border bg-game/5 px-4 py-2.5">
          <Coins className="size-4 text-game" />
          <span className="text-sm">You have <span className="font-semibold text-game">{formatNumber(availablePoints, 0)}</span> points to spend.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((r) => {
          const affordable = availablePoints >= r.pointsRequired;
          const inStock = r.stock > 0;
          return (
            <Card key={r.id} className="gap-0 border-game/30 py-4">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Gift className="size-4 text-game" />
                    <span className="font-semibold">{r.name}</span>
                  </div>
                  <Badge variant={inStock ? "secondary" : "destructive"}>{inStock ? `${r.stock} left` : "Out"}</Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-game tabular-nums">{r.pointsRequired} pts</span>
                  {canRedeem && (
                    <ActionButton
                      endpoint={`/api/gamification/rewards/${r.id}/redeem`}
                      body={{ quantity: 1 }}
                      label="Redeem"
                      icon={Gift}
                      className="bg-game text-white hover:bg-game/90"
                      disabled={!affordable || !inStock}
                      confirm="Redeem this reward?"
                      confirmDescription={`This will use ${r.pointsRequired} of your points.`}
                      successMessage="Reward requested!"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {canManage && (
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="mb-3 text-sm font-semibold">Manage rewards</h2>
            <ResourceManager
              data={rewards}
              columns={manageColumns}
              fields={fields}
              endpoint="/api/gamification/rewards"
              entityLabel="Reward"
              canManage
              searchPlaceholder="Search rewards…"
            />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold">Redemption queue</h2>
            <DataTable data={redemptions} columns={redemptionColumns} searchPlaceholder="Search redemptions…" emptyMessage="No redemptions yet." />
          </div>
        </div>
      )}
    </>
  );
}
