"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Department + date-range filter bar that persists selections in the URL. */
export function ReportFilters({ departments }: { departments: { label: string; value: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="w-48 space-y-1.5">
        <Label className="text-xs">Department</Label>
        <Select value={params.get("departmentId") ?? "all"} onValueChange={(v) => update({ departmentId: v === "all" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">From</Label>
        <Input type="date" defaultValue={params.get("from") ?? ""} onChange={(e) => update({ from: e.target.value })} className="w-40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">To</Label>
        <Input type="date" defaultValue={params.get("to") ?? ""} onChange={(e) => update({ to: e.target.value })} className="w-40" />
      </div>
      <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>Clear</Button>
    </div>
  );
}
