import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { format } from "date-fns";

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Last-12-months emissions trend (tonnes) plus a by-scope breakdown. */
export async function getEmissionsBreakdown(organizationId: string) {
  const since = monthsAgo(11);
  const txns = await prisma.carbonTransaction.findMany({
    where: { organizationId, transactionDate: { gte: since } },
    select: { transactionDate: true, co2eKg: true, scope: true },
    orderBy: { transactionDate: "asc" },
  });

  // Build 12 month buckets.
  const buckets: { key: string; label: string; kg: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = monthsAgo(i);
    buckets.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM"), kg: 0 });
  }
  const byScope: Record<string, number> = { SCOPE_1: 0, SCOPE_2: 0, SCOPE_3: 0 };
  for (const t of txns) {
    const key = format(t.transactionDate, "yyyy-MM");
    const bucket = buckets.find((b) => b.key === key);
    const kg = toNumber(t.co2eKg);
    if (bucket) bucket.kg += kg;
    byScope[t.scope] = (byScope[t.scope] ?? 0) + kg;
  }

  return {
    trend: buckets.map((b) => ({ month: b.label, tonnes: Math.round((b.kg / 1000) * 100) / 100 })),
    byScope: [
      { name: "Scope 1", value: Math.round((byScope.SCOPE_1 / 1000) * 100) / 100 },
      { name: "Scope 2", value: Math.round((byScope.SCOPE_2 / 1000) * 100) / 100 },
      { name: "Scope 3", value: Math.round((byScope.SCOPE_3 / 1000) * 100) / 100 },
    ],
    totalTonnes: Math.round((txns.reduce((s, t) => s + toNumber(t.co2eKg), 0) / 1000) * 100) / 100,
  };
}

/** Organisation ESG score trend, averaged across departments per period. */
export async function getScoreTrend(organizationId: string) {
  const rows = await prisma.departmentScore.findMany({
    where: { organizationId },
    orderBy: { periodEnd: "asc" },
  });
  const byPeriod = new Map<string, { env: number[]; soc: number[]; gov: number[]; total: number[] }>();
  for (const r of rows) {
    const key = format(r.periodEnd, "MMM");
    const entry = byPeriod.get(key) ?? { env: [], soc: [], gov: [], total: [] };
    entry.env.push(toNumber(r.environmentalScore));
    entry.soc.push(toNumber(r.socialScore));
    entry.gov.push(toNumber(r.governanceScore));
    entry.total.push(toNumber(r.totalScore));
    byPeriod.set(key, entry);
  }
  const avg = (a: number[]) => (a.length ? Math.round((a.reduce((s, v) => s + v, 0) / a.length) * 10) / 10 : 0);
  return Array.from(byPeriod.entries()).map(([month, e]) => ({
    month,
    Environmental: avg(e.env),
    Social: avg(e.soc),
    Governance: avg(e.gov),
    Overall: avg(e.total),
  }));
}

/** Headline engagement & governance rates for stat tiles. */
export async function getEngagementStats(organizationId: string) {
  const [
    csrTotal,
    csrApproved,
    ackTotal,
    ackDone,
    complianceOpen,
    complianceOverdue,
    challengeParticipants,
    activeChallenges,
  ] = await Promise.all([
    prisma.csrParticipation.count({ where: { activity: { organizationId } } }),
    prisma.csrParticipation.count({ where: { activity: { organizationId }, approvalStatus: "APPROVED" } }),
    prisma.policyAcknowledgement.count({ where: { policy: { organizationId } } }),
    prisma.policyAcknowledgement.count({ where: { policy: { organizationId }, acknowledgementStatus: "ACKNOWLEDGED" } }),
    prisma.complianceIssue.count({ where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.complianceIssue.count({ where: { organizationId, isOverdue: true } }),
    prisma.challengeParticipation.count({ where: { challenge: { organizationId } } }),
    prisma.challenge.count({ where: { organizationId, status: "ACTIVE" } }),
  ]);

  return {
    csrParticipationRate: csrTotal > 0 ? Math.round((csrApproved / csrTotal) * 100) : 0,
    csrApproved,
    policyAckRate: ackTotal > 0 ? Math.round((ackDone / ackTotal) * 100) : 0,
    complianceOpen,
    complianceOverdue,
    challengeParticipants,
    activeChallenges,
  };
}

/** Recent activity feed from the audit log. */
export async function getRecentActivity(organizationId: string, limit = 8) {
  const logs = await prisma.activityLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });
  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    user: l.user?.name ?? "System",
    createdAt: l.createdAt,
  }));
}
