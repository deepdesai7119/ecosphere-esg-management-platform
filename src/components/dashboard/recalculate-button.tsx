"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export function RecalculateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function recalc() {
    setLoading(true);
    try {
      const res = await api.post<{ departments: number }>("/api/scores/recalculate");
      toast.success(`Scores recalculated for ${res.departments} departments.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to recalculate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={recalc} disabled={loading}>
      <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
      Recalculate scores
    </Button>
  );
}
