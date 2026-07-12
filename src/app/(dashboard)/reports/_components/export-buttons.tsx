"use client";

import { FileText, Sheet, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Builds an export URL and lets the browser download it (cookies included). */
export function ExportButtons({
  type,
  filters = {},
}: {
  type: string;
  filters?: Record<string, string | undefined>;
}) {
  function url(format: string) {
    const params = new URLSearchParams({ type, format });
    for (const [k, v] of Object.entries(filters)) {
      if (v) params.set(k, v);
    }
    return `/api/reports/export?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={url("pdf")} download><FileText className="size-4" /> PDF</a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={url("excel")} download><Sheet className="size-4" /> Excel</a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={url("csv")} download><FileType className="size-4" /> CSV</a>
      </Button>
    </div>
  );
}
