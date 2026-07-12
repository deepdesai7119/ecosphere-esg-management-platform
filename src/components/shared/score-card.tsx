import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { scoreGrade } from "@/lib/esg/scoring";
import { cn } from "@/lib/utils";

const ACCENTS = {
  env: { bar: "bg-env", text: "text-env", ring: "before:bg-env" },
  social: { bar: "bg-social", text: "text-social", ring: "before:bg-social" },
  gov: { bar: "bg-gov", text: "text-gov", ring: "before:bg-gov" },
  game: { bar: "bg-game", text: "text-game", ring: "before:bg-game" },
  slate: { bar: "bg-slate-500", text: "text-foreground", ring: "before:bg-slate-500" },
} as const;

export function ScoreCard({
  label,
  score,
  accent = "slate",
  href,
  subtitle,
}: {
  label: string;
  score: number;
  accent?: keyof typeof ACCENTS;
  href?: string;
  subtitle?: string;
}) {
  const a = ACCENTS[accent];
  const body = (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden py-4 transition-shadow",
        href && "hover:shadow-md",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        a.ring,
      )}
    >
      <div className="flex items-start justify-between px-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {href && <ArrowUpRight className="size-3.5 text-muted-foreground" />}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5 px-4">
        <span className={cn("text-3xl font-bold tracking-tight tabular-nums", a.text)}>
          {Math.round(score)}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold">
          {scoreGrade(score)}
        </span>
      </div>
      <div className="mt-3 px-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", a.bar)}
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
        {subtitle && <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {body}
      </Link>
    );
  }
  return body;
}
