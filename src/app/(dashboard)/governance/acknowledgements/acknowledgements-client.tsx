"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, FileCheck2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/format";

type Pending = {
  id: string;
  policy: { id: string; title: string; code: string; acknowledgementDueDate: string | null };
};

type Ack = {
  id: string;
  acknowledgementStatus: string;
  acknowledgedAt: string | null;
  employee: { name: string } | null;
  policy: { title: string; code: string } | null;
};

const columns: ColumnDef<Ack>[] = [
  { id: "employee", header: "Employee", accessorFn: (r) => r.employee?.name ?? "—" },
  { id: "policy", header: "Policy", cell: ({ row }) => (
      <span>
        {row.original.policy?.title ?? "—"}
        {row.original.policy?.code && (
          <span className="ml-1 text-xs text-muted-foreground">({row.original.policy.code})</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "acknowledgementStatus",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.acknowledgementStatus} />,
  },
  {
    accessorKey: "acknowledgedAt",
    header: "Acknowledged",
    cell: ({ row }) =>
      row.original.acknowledgedAt ? formatDateTime(row.original.acknowledgedAt) : <span className="text-muted-foreground">—</span>,
  },
];

export function AcknowledgementsClient({
  myPending,
  allAcks,
  canManage,
  canAcknowledge,
}: {
  myPending: Pending[];
  allAcks: Ack[];
  canManage: boolean;
  canAcknowledge: boolean;
}) {
  return (
    <div className="space-y-6">
      {canAcknowledge && (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileCheck2 className="size-4 text-gov" />
            My pending acknowledgements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myPending.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="You're all caught up"
              description="No policies are waiting for your acknowledgement."
            />
          ) : (
            <ul className="divide-y">
              {myPending.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.policy.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.policy.code}
                      {p.policy.acknowledgementDueDate && ` · Due ${formatDate(p.policy.acknowledgementDueDate)}`}
                    </p>
                  </div>
                  <ActionButton
                    endpoint={`/api/governance/policies/${p.policy.id}/acknowledge`}
                    method="post"
                    label="Acknowledge"
                    icon={CheckCircle2}
                    successMessage="Policy acknowledged."
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      )}

      {canManage && (
        <div>
          <h2 className="mb-3 text-sm font-semibold">All acknowledgements</h2>
          <DataTable
            data={allAcks}
            columns={columns}
            searchPlaceholder="Search acknowledgements…"
            emptyMessage="No acknowledgement records yet."
          />
        </div>
      )}
    </div>
  );
}
