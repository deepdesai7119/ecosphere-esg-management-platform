"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmptyState } from "@/components/shared/empty-state";
import { ExportButtons } from "../_components/export-buttons";
import { api } from "@/lib/api-client";

type Option = { label: string; value: string };
interface Dataset {
  title: string;
  sections: { heading: string; columns: string[]; rows: (string | number)[][] }[];
  summary?: Record<string, string | number>;
}

const MODULES: Option[] = [
  { label: "Environmental", value: "environmental" },
  { label: "Social", value: "social" },
  { label: "Governance", value: "governance" },
  { label: "Gamification", value: "gamification" },
];

export function CustomBuilder({
  departments,
  employees,
  challenges,
  categories,
}: {
  departments: Option[];
  employees: Option[];
  challenges: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";

  const [filters, setFilters] = useState<Record<string, string>>({
    from: get("from"),
    to: get("to"),
    departmentId: get("departmentId"),
    module: get("module"),
    employeeId: get("employeeId"),
    challengeId: get("challengeId"),
    esgCategory: get("esgCategory"),
  });
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) {
    setFilters((p) => ({ ...p, [k]: v }));
  }

  function activeFilters(): Record<string, string | undefined> {
    const out: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(filters)) if (v) out[k] = v;
    return out;
  }

  function persistUrl() {
    const q = new URLSearchParams(activeFilters() as Record<string, string>);
    router.replace(`/reports/custom?${q.toString()}`);
  }

  async function run() {
    setLoading(true);
    persistUrl();
    try {
      const q = new URLSearchParams({ type: "custom", ...(activeFilters() as Record<string, string>) });
      const data = await api.get<Dataset>(`/api/reports/preview?${q.toString()}`);
      setDataset(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to run report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} />
          </div>
          <FilterSelect label="Department" value={filters.departmentId} onChange={(v) => set("departmentId", v)} options={departments} />
          <FilterSelect label="Module" value={filters.module} onChange={(v) => set("module", v)} options={MODULES} />
          <FilterSelect label="Employee" value={filters.employeeId} onChange={(v) => set("employeeId", v)} options={employees} />
          <FilterSelect label="Challenge" value={filters.challengeId} onChange={(v) => set("challengeId", v)} options={challenges} />
          <FilterSelect label="ESG Category" value={filters.esgCategory} onChange={(v) => set("esgCategory", v)} options={categories} />
          <div className="flex items-end">
            <Button onClick={run} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {dataset && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{dataset.title}</p>
          <ExportButtons type="custom" filters={activeFilters()} />
        </div>
      )}

      {!dataset ? (
        <EmptyState icon={Play} title="Build your report" description="Choose filters and run the report to preview and export." />
      ) : (
        <div className="space-y-4">
          {dataset.summary && Object.keys(dataset.summary).length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(dataset.summary).map(([k, v]) => (
                <Card key={k} className="gap-0 py-3"><CardContent className="px-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-lg font-semibold tabular-nums">{v}</p></CardContent></Card>
              ))}
            </div>
          )}
          {dataset.sections.map((s) => (
            <Card key={s.heading}>
              <CardContent className="py-4">
                <p className="mb-2 text-sm font-semibold">{s.heading}</p>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>{s.columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-medium">{c}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y">
                      {s.rows.length === 0 ? (
                        <tr><td colSpan={s.columns.length} className="px-3 py-4 text-center text-muted-foreground">No records.</td></tr>
                      ) : s.rows.map((row, ri) => (
                        <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="whitespace-nowrap px-3 py-2 tabular-nums">{cell}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Option[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
        <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
