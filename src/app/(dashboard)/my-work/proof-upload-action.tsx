"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUpload } from "@/components/shared/file-upload";
import { api } from "@/lib/api-client";

/**
 * Uploads a proof file then submits its URL to the given participation endpoint
 * (CSR proof or challenge progress). Refreshes on success.
 */
export function ProofUploadAction({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  return (
    <FileUpload
      label="Upload proof"
      onUploaded={async (url) => {
        try {
          await api.post(endpoint, { proofFileUrl: url });
          toast.success("Proof submitted.");
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to submit proof.");
        }
      }}
    />
  );
}
