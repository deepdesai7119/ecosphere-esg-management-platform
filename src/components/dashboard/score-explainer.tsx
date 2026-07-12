"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface PillarBreakdown {
  key: string;
  label: string;
  score: number;
  weight: number;
  components: { label: string; weight: number; value: number; contribution: number }[];
}

export function ScoreExplainer({
  overall,
  pillars,
}: {
  overall: number;
  pillars: PillarBreakdown[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="size-4" /> How is this calculated?
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>ESG score methodology</SheetTitle>
          <SheetDescription>
            Every score is computed live from your data on a 0–100 scale. The overall
            score is the weighted sum of the three pillars.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall ESG score</span>
              <span className="text-lg font-bold tabular-nums">{overall}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              = {pillars.map((p) => `${p.label} × ${p.weight}%`).join(" + ")}
            </p>
          </div>

          {pillars.map((p) => (
            <div key={p.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  {p.label} <span className="text-xs font-normal text-muted-foreground">(weight {p.weight}%)</span>
                </h4>
                <span className="text-sm font-bold tabular-nums">{p.score}</span>
              </div>
              <div className="space-y-1.5">
                {p.components.map((c) => (
                  <div key={c.label} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {c.label} · {Math.round(c.weight * 100)}%
                      </span>
                      <span className="tabular-nums">{c.value.toFixed(1)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${c.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
