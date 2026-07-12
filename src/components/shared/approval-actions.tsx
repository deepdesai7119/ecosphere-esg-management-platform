"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";

/**
 * Approve / Reject buttons posting `{ decision, reviewComment }` to a review
 * endpoint. Rejecting prompts for an optional reason.
 */
export function ApprovalActions({
  endpoint,
  size = "sm",
}: {
  endpoint: string;
  size?: "sm" | "icon";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState("");

  async function decide(decision: "APPROVED" | "REJECTED", reviewComment?: string) {
    setLoading(decision);
    try {
      await api.post(endpoint, { decision, reviewComment });
      toast.success(decision === "APPROVED" ? "Approved." : "Rejected.");
      setRejectOpen(false);
      setComment("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size={size}
          className="bg-success text-white hover:bg-success/90"
          disabled={loading !== null}
          onClick={() => decide("APPROVED")}
        >
          {loading === "APPROVED" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {size === "sm" && "Approve"}
        </Button>
        <Button
          size={size}
          variant="outline"
          className="border-danger/40 text-danger hover:bg-danger/10"
          disabled={loading !== null}
          onClick={() => setRejectOpen(true)}
        >
          <X className="size-4" />
          {size === "sm" && "Reject"}
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Let them know why…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={loading !== null}
              onClick={() => decide("REJECTED", comment)}
            >
              {loading === "REJECTED" && <Loader2 className="size-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
