"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * Uploads a PDF/PNG/JPG to /api/uploads and returns the stored URL via
 * `onUploaded`. Validates nothing client-side beyond accept — the server
 * enforces type and size.
 */
export function FileUpload({
  onUploaded,
  subdir = "proofs",
  label = "Attach proof",
  className,
}: {
  onUploaded: (url: string) => void;
  subdir?: string;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("subdir", subdir);
      const res = await api.upload<{ url: string; filename: string }>("/api/uploads", form);
      setFilename(file.name);
      onUploaded(res.url);
      toast.success("File uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : filename ? (
          <CheckCircle2 className="size-4 text-success" />
        ) : (
          <Paperclip className="size-4" />
        )}
        {filename ?? label}
      </Button>
    </div>
  );
}
