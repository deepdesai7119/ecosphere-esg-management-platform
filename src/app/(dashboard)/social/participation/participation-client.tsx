"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileUpload } from "@/components/shared/file-upload";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { formatDate, formatNumber } from "@/lib/format";

type QueueRow = {
  id: string;
  proofFileUrl: string | null;
  approvalStatus: string;
  pointsEarned: number;
  joinedAt: string;
  employee: { name: string };
  activity: { title: string; points: number; evidenceRequired: boolean };
};

type MineRow = {
  id: string;
  proofFileUrl: string | null;
  proofComment: string | null;
  approvalStatus: string;
  pointsEarned: number;
  joinedAt: string;
  activity: { title: string; points: number; evidenceRequired: boolean };
};

function ProofLink({ url }: { url: string | null }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-social hover:underline"
    >
      View <ExternalLink className="size-3.5" />
    </a>
  );
}

function ProofSubmit({ participationId }: { participationId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!url && !comment.trim()) {
      toast.error("Attach a file or add a comment first.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/social/participation/${participationId}/proof`, {
        proofFileUrl: url ?? undefined,
        proofComment: comment.trim() || undefined,
      });
      toast.success("Proof submitted.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit proof.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <p className="text-xs font-medium text-muted-foreground">Submit proof of participation</p>
      <FileUpload onUploaded={setUrl} label="Attach proof" />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional note for the reviewer…"
        rows={2}
      />
      <Button size="sm" onClick={submit} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Submit proof
      </Button>
    </div>
  );
}

export function ParticipationClient({
  queue,
  mine,
  canApprove,
}: {
  queue: QueueRow[];
  mine: MineRow[];
  canApprove: boolean;
}) {
  const columns: ColumnDef<QueueRow>[] = [
    { accessorKey: "employee", header: "Employee", cell: ({ row }) => row.original.employee.name },
    { accessorKey: "activity", header: "Activity", cell: ({ row }) => row.original.activity.title },
    { id: "proof", header: "Proof", cell: ({ row }) => <ProofLink url={row.original.proofFileUrl} /> },
    {
      id: "points",
      header: "Points",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatNumber(row.original.pointsEarned || row.original.activity.points, 0)}
        </span>
      ),
    },
    { accessorKey: "approvalStatus", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} /> },
    { accessorKey: "joinedAt", header: "Joined", cell: ({ row }) => formatDate(row.original.joinedAt) },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.approvalStatus === "PENDING" ? (
          <ApprovalActions endpoint={`/api/social/participation/${row.original.id}/review`} />
        ) : null,
    },
  ];

  return (
    <div className="space-y-8">
      {canApprove && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Approval queue</h2>
          <DataTable
            data={queue}
            columns={columns}
            searchPlaceholder="Search submissions…"
            emptyMessage="No participations to review."
          />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">My participations</h2>
        {mine.length === 0 ? (
          <EmptyState
            title="You haven't joined any activities"
            description="Join a CSR activity to start earning points."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mine.map((p) => {
              const needsProof = !p.proofFileUrl && p.approvalStatus === "PENDING";
              return (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">{p.activity.title}</CardTitle>
                      <StatusBadge status={p.approvalStatus} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="info">{formatNumber(p.activity.points, 0)} pts</Badge>
                      {p.activity.evidenceRequired && <Badge variant="warning">Evidence Required</Badge>}
                      <span>Joined {formatDate(p.joinedAt)}</span>
                    </div>
                    {p.proofFileUrl ? (
                      <p className="text-sm">
                        Proof: <ProofLink url={p.proofFileUrl} />
                      </p>
                    ) : needsProof ? (
                      <ProofSubmit participationId={p.id} />
                    ) : (
                      <p className="text-xs text-muted-foreground">No proof attached.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
