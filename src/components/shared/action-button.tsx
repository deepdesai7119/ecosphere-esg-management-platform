"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost";

/**
 * Generic button that POSTs (or PATCH/DELETE) to an endpoint, shows a toast and
 * refreshes the route. Optionally guarded by a confirmation dialog.
 */
export function ActionButton({
  endpoint,
  method = "post",
  body,
  label,
  icon: Icon,
  variant = "default",
  size = "sm",
  confirm,
  confirmDescription,
  successMessage,
  disabled,
  className,
}: {
  endpoint: string;
  method?: "post" | "patch" | "delete";
  body?: unknown;
  label: string;
  icon?: LucideIcon;
  variant?: Variant;
  size?: "sm" | "default" | "icon";
  confirm?: string;
  confirmDescription?: string;
  successMessage?: string;
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function run() {
    setLoading(true);
    try {
      if (method === "delete") await api.delete(endpoint);
      else if (method === "patch") await api.patch(endpoint, body);
      else await api.post(endpoint, body);
      if (successMessage) toast.success(successMessage);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled || loading}
        className={cn(className)}
        onClick={() => (confirm ? setConfirmOpen(true) : run())}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
        {label}
      </Button>
      {confirm && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirm}
          description={confirmDescription}
          confirmLabel="Confirm"
          onConfirm={run}
        />
      )}
    </>
  );
}
