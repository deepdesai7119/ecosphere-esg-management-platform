"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { FileUpload } from "@/components/shared/file-upload";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api-client";
import { toNumber } from "@/lib/format";

type Part = {
  id: string;
  employeeId: string;
  approvalStatus: string;
  progressPercentage: string | number;
  proofFileUrl: string | null;
  xpAwarded: number;
  challenge: { title: string; xp: number; evidenceRequired: boolean };
  employee: { name: string };
};

export function ChallengeParticipationClient({
  data,
  canApprove,
  currentUserId,
}: {
  data: Part[];
  canApprove: boolean;
  currentUserId: string;
}) {
  const router = useRouter();

  const columns: ColumnDef<Part>[] = [
    { id: "employee", header: "Employee", accessorFn: (r) => r.employee.name },
    { id: "challenge", header: "Challenge", accessorFn: (r) => r.challenge.title },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => (
        <div className="flex w-28 items-center gap-2">
          <Progress value={toNumber(row.original.progressPercentage)} className="h-1.5" />
          <span className="w-8 text-right text-xs tabular-nums">{Math.round(toNumber(row.original.progressPercentage))}%</span>
        </div>
      ),
    },
    {
      id: "proof",
      header: "Proof",
      cell: ({ row }) =>
        row.original.proofFileUrl ? (
          <a href={row.original.proofFileUrl} target="_blank" rel="noreferrer" className="text-sm text-social hover:underline">View</a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { accessorKey: "approvalStatus", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const p = row.original;
        if (canApprove && p.approvalStatus === "PENDING") {
          return <ApprovalActions endpoint={`/api/gamification/participation/${p.id}/review`} />;
        }
        if (
          p.employeeId === currentUserId &&
          p.approvalStatus === "PENDING" &&
          p.challenge.evidenceRequired &&
          !p.proofFileUrl
        ) {
          return (
            <FileUpload
              label="Submit proof"
              onUploaded={async (url) => {
                try {
                  await api.post(`/api/gamification/participation/${p.id}/progress`, { proofFileUrl: url, progressPercentage: 100 });
                  toast.success("Proof submitted.");
                  router.refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed.");
                }
              }}
            />
          );
        }
        return null;
      },
    },
  ];

  return <DataTable data={data} columns={columns} searchPlaceholder="Search participation…" emptyMessage="No challenge participation yet." pageSize={12} />;
}
