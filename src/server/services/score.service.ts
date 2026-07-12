import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { toNumber } from "@/lib/format";
import { getWeights } from "./config.service";
import { logActivity } from "./activityLog.service";
import {
  clamp,
  complianceScore,
  environmentalScore,
  goalProgress,
  governanceScore,
  overallScore,
  rate,
  reductionScore,
  socialScore,
  type ScoreResult,
} from "@/lib/esg/scoring";

/** Raw 0–100 sub-metrics gathered for a scope (org-wide or single department). */
interface Submetrics {
  goalProgress: number;
  emissionReduction: number;
  dataCompleteness: number;
  csrParticipation: number;
  trainingCompletion: number;
  engagementDiversity: number;
  policyAcknowledgement: number;
  auditPerformance: number;
  complianceResolution: number;
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function gatherMetrics(
  organizationId: string,
  departmentId: string | null,
): Promise<Submetrics> {
  const deptWhere = departmentId ? { departmentId } : {};
  const memberWhere = departmentId
    ? { organizationId, departmentId }
    : { organizationId };
  const memberFilter = departmentId ? { employee: { departmentId } } : {};

  const [
    goals,
    carbonRecent,
    carbonPrev,
    opsCount,
    txnCount,
    memberCount,
    disclosedProfiles,
    csrApproved,
    activeTrainings,
    trainingsCompleted,
    acksTotal,
    acksDone,
    auditAgg,
    complianceGroups,
  ] = await Promise.all([
    prisma.environmentalGoal.findMany({ where: { organizationId, ...deptWhere } }),
    prisma.carbonTransaction.aggregate({
      _sum: { co2eKg: true },
      where: { organizationId, ...deptWhere, transactionDate: { gte: monthsAgo(6) } },
    }),
    prisma.carbonTransaction.aggregate({
      _sum: { co2eKg: true },
      where: {
        organizationId,
        ...deptWhere,
        transactionDate: { gte: monthsAgo(12), lt: monthsAgo(6) },
      },
    }),
    prisma.businessOperation.count({ where: { organizationId, ...deptWhere } }),
    prisma.carbonTransaction.count({ where: { organizationId, ...deptWhere } }),
    prisma.user.count({ where: { ...memberWhere, status: "ACTIVE" } }),
    prisma.user.count({
      where: { ...memberWhere, status: "ACTIVE", profile: { gender: { not: "UNDISCLOSED" } } },
    }),
    prisma.csrParticipation.count({
      where: { approvalStatus: "APPROVED", ...memberFilter },
    }),
    prisma.training.count({ where: { organizationId, ...deptWhere, status: "ACTIVE" } }),
    prisma.trainingCompletion.count({
      where: { status: "COMPLETED", ...memberFilter },
    }),
    prisma.policyAcknowledgement.count({ where: { ...memberFilter } }),
    prisma.policyAcknowledgement.count({
      where: { acknowledgementStatus: "ACKNOWLEDGED", ...memberFilter },
    }),
    prisma.audit.aggregate({
      _avg: { score: true },
      where: { organizationId, ...deptWhere, score: { not: null } },
    }),
    prisma.complianceIssue.groupBy({
      by: ["status", "isOverdue"],
      where: { organizationId, ...deptWhere },
      _count: { _all: true },
    }),
  ]);

  // Environmental
  const goalAvg =
    goals.length > 0
      ? goals.reduce(
          (sum, g) =>
            sum +
            goalProgress(
              toNumber(g.currentValue),
              toNumber(g.baselineValue),
              toNumber(g.targetValue),
            ),
          0,
        ) / goals.length
      : 60;
  const emissionReduction = reductionScore(
    toNumber(carbonPrev._sum.co2eKg),
    toNumber(carbonRecent._sum.co2eKg),
  );
  const dataCompleteness = opsCount > 0 ? rate(txnCount, opsCount) : 40;

  // Social
  const csrParticipation = memberCount > 0 ? clamp((csrApproved / memberCount) * 100) : 0;
  const expectedCompletions = memberCount * Math.max(activeTrainings, 1);
  const trainingCompletion =
    expectedCompletions > 0 ? rate(trainingsCompleted, expectedCompletions) : 70;
  const engagementDiversity = memberCount > 0 ? rate(disclosedProfiles, memberCount) : 50;

  // Governance
  const policyAcknowledgement = acksTotal > 0 ? rate(acksDone, acksTotal) : 60;
  const auditPerformance = auditAgg._avg.score != null ? toNumber(auditAgg._avg.score) : 65;
  let total = 0;
  let resolved = 0;
  let overdue = 0;
  for (const g of complianceGroups) {
    const c = g._count._all;
    total += c;
    if (g.status === "RESOLVED" || g.status === "CLOSED") resolved += c;
    if (g.isOverdue) overdue += c;
  }
  const complianceResolution = complianceScore({
    totalIssues: total,
    resolvedIssues: resolved,
    overdueIssues: overdue,
  });

  return {
    goalProgress: goalAvg,
    emissionReduction,
    dataCompleteness,
    csrParticipation,
    trainingCompletion,
    engagementDiversity,
    policyAcknowledgement,
    auditPerformance,
    complianceResolution,
  };
}

export interface PillarScores {
  environmental: ScoreResult;
  social: ScoreResult;
  governance: ScoreResult;
  overall: number;
}

function scoreFromMetrics(
  m: Submetrics,
  weights: { environmental: number; social: number; governance: number },
): PillarScores {
  const environmental = environmentalScore({
    goalProgress: m.goalProgress,
    emissionReduction: m.emissionReduction,
    dataCompleteness: m.dataCompleteness,
  });
  const social = socialScore({
    csrParticipation: m.csrParticipation,
    trainingCompletion: m.trainingCompletion,
    engagementDiversity: m.engagementDiversity,
  });
  const governance = governanceScore({
    policyAcknowledgement: m.policyAcknowledgement,
    auditPerformance: m.auditPerformance,
    complianceResolution: m.complianceResolution,
  });
  const overall = overallScore(
    {
      environmental: environmental.score,
      social: social.score,
      governance: governance.score,
    },
    weights,
  );
  return { environmental, social, governance, overall };
}

/** Live organisation-wide scores (used by the dashboard and ESG summary). */
export async function getOrganizationScores(organizationId: string): Promise<
  PillarScores & { weights: { environmental: number; social: number; governance: number } }
> {
  const weights = await getWeights(organizationId);
  const metrics = await gatherMetrics(organizationId, null);
  return { ...scoreFromMetrics(metrics, weights), weights };
}

export interface DepartmentScoreResult {
  departmentId: string;
  name: string;
  scores: PillarScores;
}

/** Live per-department scores for ranking. */
export async function getDepartmentScores(
  organizationId: string,
): Promise<DepartmentScoreResult[]> {
  const weights = await getWeights(organizationId);
  const departments = await prisma.department.findMany({
    where: { organizationId, status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
  const results: DepartmentScoreResult[] = [];
  for (const dept of departments) {
    const metrics = await gatherMetrics(organizationId, dept.id);
    results.push({
      departmentId: dept.id,
      name: dept.name,
      scores: scoreFromMetrics(metrics, weights),
    });
  }
  return results.sort((a, b) => b.scores.overall - a.scores.overall);
}

/**
 * Recalculate and persist a DepartmentScore snapshot for every department.
 * Backs the "Recalculate Scores" admin action.
 */
export async function recalculateAndPersistScores(organizationId: string, actorId: string) {
  const results = await getDepartmentScores(organizationId);
  const periodStart = monthsAgo(12);
  const periodEnd = new Date();

  for (const r of results) {
    await prisma.departmentScore.create({
      data: {
        organizationId,
        departmentId: r.departmentId,
        periodStart,
        periodEnd,
        environmentalScore: r.scores.environmental.score,
        socialScore: r.scores.social.score,
        governanceScore: r.scores.governance.score,
        totalScore: r.scores.overall,
        calculationDetails: {
          environmental: r.scores.environmental.components,
          social: r.scores.social.components,
          governance: r.scores.governance.components,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  await logActivity({
    organizationId,
    userId: actorId,
    action: "score.recalculate",
    entityType: "DepartmentScore",
    newData: { departments: results.length },
  });

  return results;
}
