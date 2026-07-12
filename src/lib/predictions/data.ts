import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { getOrganizationScores } from "@/server/services/score.service";

/** Month bucket helper: "2026-07" style key + human label. */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export interface MonthlySeriesPoint {
  key: string; // "2026-07"
  label: string; // "Jul 2026"
  value: number;
}

/**
 * Monthly total emissions (tCO2e) for an organisation over the trailing
 * `months` calendar months, oldest first. Buckets in JS since we only need a
 * handful of rows per org and want to stay portable across DB engines.
 */
export async function getMonthlyEmissions(
  organizationId: string,
  departmentId: string | null,
  months = 12,
): Promise<MonthlySeriesPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const transactions = await prisma.carbonTransaction.findMany({
    where: {
      organizationId,
      ...(departmentId ? { departmentId } : {}),
      transactionDate: { gte: since },
    },
    select: { transactionDate: true, co2eKg: true },
  });

  const buckets = new Map<string, number>();
  const cursor = new Date(since);
  for (let i = 0; i < months; i++) {
    buckets.set(monthKey(cursor), 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const t of transactions) {
    const key = monthKey(t.transactionDate);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + toNumber(t.co2eKg) / 1000); // kg -> t
    }
  }

  return Array.from(buckets.entries()).map(([key, value]) => {
    const [y, m] = key.split("-").map(Number);
    return { key, label: monthLabel(new Date(y, m - 1, 1)), value: Math.round(value * 100) / 100 };
  });
}

/**
 * Org-wide ESG score history from persisted `DepartmentScore` snapshots
 * (created by "Recalculate Scores"). Multiple departments can share a
 * `periodEnd`; those are averaged into one org-wide point per period.
 * Falls back to a single live point (today's score) when no snapshots exist
 * yet, so a brand-new org still gets a sane answer.
 */
export async function getEsgScoreHistory(
  organizationId: string,
): Promise<MonthlySeriesPoint[]> {
  const snapshots = await prisma.departmentScore.findMany({
    where: { organizationId },
    orderBy: { periodEnd: "asc" },
    select: { periodEnd: true, totalScore: true },
  });

  if (snapshots.length === 0) {
    const live = await getOrganizationScores(organizationId);
    const now = new Date();
    return [{ key: monthKey(now), label: monthLabel(now), value: Math.round(live.overall * 10) / 10 }];
  }

  const byPeriod = new Map<string, number[]>();
  for (const s of snapshots) {
    const key = monthKey(s.periodEnd);
    const arr = byPeriod.get(key) ?? [];
    arr.push(toNumber(s.totalScore));
    byPeriod.set(key, arr);
  }

  return Array.from(byPeriod.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, values]) => {
      const [y, m] = key.split("-").map(Number);
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      return { key, label: monthLabel(new Date(y, m - 1, 1)), value: Math.round(avg * 10) / 10 };
    });
}

export interface ComplianceRiskItem {
  id: string;
  title: string;
  severity: string;
  daysUntilDue: number | null;
  isOverdue: boolean;
  riskLevel: "overdue" | "high" | "medium" | "low";
}

export interface ComplianceRiskSummary {
  openCount: number;
  overdueCount: number;
  atRiskItems: ComplianceRiskItem[];
  avgResolutionDays: number | null;
}

/**
 * Predicts which open/in-progress compliance issues are likely to slip.
 * Model: compare each issue's days-until-due against the org's own historical
 * average resolution time (createdAt -> resolvedAt for RESOLVED/CLOSED issues).
 * An issue is "high risk" if it has less runway than the org typically needs;
 * "medium" if it's within 1.5x that runway. This is a heuristic, not a
 * guarantee — it's meant to prioritise attention, not replace judgement.
 */
export async function getComplianceRisk(
  organizationId: string,
  departmentId: string | null,
): Promise<ComplianceRiskSummary> {
  const deptWhere = departmentId ? { departmentId } : {};

  const [openIssues, resolvedIssues] = await Promise.all([
    prisma.complianceIssue.findMany({
      where: { organizationId, ...deptWhere, status: { in: ["OPEN", "IN_PROGRESS"] } },
      select: { id: true, title: true, severity: true, dueDate: true, isOverdue: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.complianceIssue.findMany({
      where: {
        organizationId,
        ...deptWhere,
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
    }),
  ]);

  const resolutionDays = resolvedIssues
    .map((i) => (i.resolvedAt ? (i.resolvedAt.getTime() - i.createdAt.getTime()) / 86_400_000 : null))
    // Ignore bad rows where resolvedAt precedes createdAt (seed/backfill artifacts).
    .filter((d): d is number => d !== null && d >= 0);
  const avgResolutionDays =
    resolutionDays.length > 0
      ? Math.round(resolutionDays.reduce((s, d) => s + d, 0) / resolutionDays.length)
      : null;

  const now = Date.now();
  const items: ComplianceRiskItem[] = openIssues.map((issue) => {
    const daysUntilDue = issue.dueDate ? Math.round((issue.dueDate.getTime() - now) / 86_400_000) : null;
    let riskLevel: ComplianceRiskItem["riskLevel"] = "low";
    if (issue.isOverdue || (daysUntilDue !== null && daysUntilDue < 0)) {
      riskLevel = "overdue";
    } else if (daysUntilDue !== null && avgResolutionDays !== null) {
      if (daysUntilDue < avgResolutionDays) riskLevel = "high";
      else if (daysUntilDue < avgResolutionDays * 1.5) riskLevel = "medium";
    } else if (daysUntilDue !== null && daysUntilDue <= 7) {
      // No history yet to compare against — fall back to a flat 7-day warning window.
      riskLevel = "high";
    }
    return {
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      daysUntilDue,
      isOverdue: issue.isOverdue,
      riskLevel,
    };
  });

  return {
    openCount: openIssues.length,
    overdueCount: items.filter((i) => i.riskLevel === "overdue").length,
    atRiskItems: items
      .filter((i) => i.riskLevel === "overdue" || i.riskLevel === "high")
      .sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0)),
    avgResolutionDays,
  };
}
