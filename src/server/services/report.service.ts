import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { goalProgress, scoreGrade } from "@/lib/esg/scoring";
import { getEmissionsBreakdown } from "@/server/repositories/dashboard.repository";
import { getOrganizationScores, getDepartmentScores } from "./score.service";

/** Filters accepted by every report builder. Dates are inclusive bounds. */
export interface ReportFilters {
  organizationId: string;
  departmentId?: string;
  from?: Date;
  to?: Date;
  module?: string;
  employeeId?: string;
  challengeId?: string;
  esgCategory?: string;
}

/** One titled block of a report — renders as a table in every output format. */
export interface ReportSection {
  heading: string;
  columns: string[];
  rows: (string | number)[][];
}

/** A chart the PDF exporter renders natively (column / area / proportion). */
export interface ReportChart {
  type: "column" | "area" | "proportion";
  title: string;
  unit?: string;
  data: { label: string; value: number; color?: string }[];
}

/** Normalized dataset consumed by both the preview UI and the file exporters. */
export interface ReportDataset {
  title: string;
  generatedAt: Date;
  sections: ReportSection[];
  charts?: ReportChart[];
  summary?: Record<string, string | number>;
}

const CHART = {
  green: "#16a34a",
  blue: "#2563eb",
  purple: "#7c3aed",
  cyan: "#0891b2",
  amber: "#d97706",
  orange: "#f97316",
  red: "#dc2626",
  slate: "#94a3b8",
};

// ----------------------------- helpers -----------------------------

/** Build an inclusive Prisma date filter, or undefined when no bounds set. */
function dateRange(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  const r: Prisma.DateTimeFilter = {};
  if (from) r.gte = from;
  if (to) r.lte = to;
  return r;
}

/** kg CO2e → tonnes, rounded to 2 dp. */
function tonnes(kg: unknown): number {
  return Math.round((toNumber(kg) / 1000) * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

const SCOPE_LABEL: Record<string, string> = {
  SCOPE_1: "Scope 1 · Direct",
  SCOPE_2: "Scope 2 · Energy",
  SCOPE_3: "Scope 3 · Value chain",
};

function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function fmtDate(value: Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toISOString().slice(0, 10);
}

async function departmentNameMap(organizationId: string): Promise<Map<string, string>> {
  const departments = await prisma.department.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });
  return new Map(departments.map((d) => [d.id, d.name]));
}

// ----------------------------- Environmental -----------------------------

export async function buildEnvironmentalReport(filters: ReportFilters): Promise<ReportDataset> {
  const { organizationId, departmentId } = filters;
  const range = dateRange(filters.from, filters.to);
  const where: Prisma.CarbonTransactionWhereInput = {
    organizationId,
    ...(departmentId ? { departmentId } : {}),
    ...(range ? { transactionDate: range } : {}),
  };

  const [totalAgg, byScope, byDept, deptNames, goals, breakdown] = await Promise.all([
    prisma.carbonTransaction.aggregate({ _sum: { co2eKg: true }, _count: { _all: true }, where }),
    prisma.carbonTransaction.groupBy({ by: ["scope"], _sum: { co2eKg: true }, where }),
    prisma.carbonTransaction.groupBy({ by: ["departmentId"], _sum: { co2eKg: true }, where }),
    departmentNameMap(organizationId),
    prisma.environmentalGoal.findMany({
      where: { organizationId, ...(departmentId ? { departmentId } : {}) },
      include: { department: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    getEmissionsBreakdown(organizationId),
  ]);

  const totalTonnes = tonnes(totalAgg._sum.co2eKg);
  const scopeMap = new Map(byScope.map((s) => [s.scope, tonnes(s._sum.co2eKg)]));
  const s1 = scopeMap.get("SCOPE_1") ?? 0;
  const s2 = scopeMap.get("SCOPE_2") ?? 0;
  const s3 = scopeMap.get("SCOPE_3") ?? 0;

  const sections: ReportSection[] = [
    {
      heading: "Emissions by scope",
      columns: ["Scope", "tCO₂e", "Share %"],
      rows: (["SCOPE_1", "SCOPE_2", "SCOPE_3"] as const).map((sc) => {
        const t = scopeMap.get(sc) ?? 0;
        return [SCOPE_LABEL[sc], t, pct(t, totalTonnes)];
      }),
    },
    {
      heading: "Emissions by department",
      columns: ["Department", "tCO₂e", "Share %"],
      rows: byDept
        .map((d) => {
          const t = tonnes(d._sum.co2eKg);
          const name = d.departmentId ? deptNames.get(d.departmentId) ?? "Unknown" : "Unassigned";
          return [name, t, pct(t, totalTonnes)] as (string | number)[];
        })
        .sort((a, b) => Number(b[1]) - Number(a[1])),
    },
    {
      heading: "Monthly trend · last 12 months (org-wide)",
      columns: ["Month", "tCO₂e"],
      rows: breakdown.trend.map((m) => [m.month, m.tonnes]),
    },
    {
      heading: "Goal performance",
      columns: ["Goal", "Department", "Baseline", "Target", "Current", "Progress %", "Status"],
      rows: goals.map((g) => [
        g.name,
        g.department?.name ?? "Org-wide",
        `${toNumber(g.baselineValue)} ${g.unit}`,
        `${toNumber(g.targetValue)} ${g.unit}`,
        `${toNumber(g.currentValue)} ${g.unit}`,
        Math.round(
          goalProgress(toNumber(g.currentValue), toNumber(g.baselineValue), toNumber(g.targetValue)),
        ),
        humanize(g.status),
      ]),
    },
  ];

  const deptChart = byDept
    .map((d) => ({
      label: d.departmentId ? deptNames.get(d.departmentId) ?? "Unknown" : "Unassigned",
      value: tonnes(d._sum.co2eKg),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    title: "Environmental Report",
    generatedAt: new Date(),
    sections,
    charts: [
      {
        type: "column",
        title: "Emissions by scope (tCO2e)",
        unit: "t",
        data: [
          { label: "Scope 1", value: s1, color: CHART.green },
          { label: "Scope 2", value: s2, color: CHART.blue },
          { label: "Scope 3", value: s3, color: CHART.purple },
        ],
      },
      {
        type: "area",
        title: "Monthly emissions trend (tCO2e)",
        data: breakdown.trend.map((m) => ({ label: m.month, value: m.tonnes })),
      },
      ...(deptChart.length
        ? [{ type: "column" as const, title: "Emissions by department (tCO2e)", data: deptChart }]
        : []),
    ],
    summary: {
      "Total emissions (tCO₂e)": totalTonnes,
      Transactions: totalAgg._count._all,
      "Scope 1 (tCO₂e)": s1,
      "Scope 2 (tCO₂e)": s2,
      "Scope 3 (tCO₂e)": s3,
      "Tracked goals": goals.length,
    },
  };
}

// ----------------------------- Social -----------------------------

export async function buildSocialReport(filters: ReportFilters): Promise<ReportDataset> {
  const { organizationId, departmentId } = filters;
  const deptWhere = departmentId ? { departmentId } : {};
  const activityRange = dateRange(filters.from, filters.to);
  const joinedRange = dateRange(filters.from, filters.to);

  const participationWhere: Prisma.CsrParticipationWhereInput = {
    activity: { organizationId, ...deptWhere },
    ...(joinedRange ? { joinedAt: joinedRange } : {}),
  };

  const [activities, partGroups, pointsAgg, trainingGroups, genderGroups] = await Promise.all([
    prisma.csrActivity.findMany({
      where: {
        organizationId,
        ...deptWhere,
        ...(activityRange ? { activityDate: activityRange } : {}),
      },
      include: {
        department: { select: { name: true } },
        participations: { select: { approvalStatus: true, pointsEarned: true } },
      },
      orderBy: { activityDate: "desc" },
    }),
    prisma.csrParticipation.groupBy({
      by: ["approvalStatus"],
      _count: { _all: true },
      where: participationWhere,
    }),
    prisma.csrParticipation.aggregate({ _sum: { pointsEarned: true }, where: participationWhere }),
    prisma.trainingCompletion.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { training: { organizationId, ...deptWhere } },
    }),
    prisma.employeeProfile.groupBy({
      by: ["gender"],
      _count: { _all: true },
      where: { user: { organizationId, status: "ACTIVE", ...deptWhere } },
    }),
  ]);

  const partByStatus = new Map(partGroups.map((g) => [g.approvalStatus, g._count._all]));
  const totalParticipations = partGroups.reduce((s, g) => s + g._count._all, 0);
  const approved = partByStatus.get("APPROVED") ?? 0;

  const trainingByStatus = new Map(trainingGroups.map((g) => [g.status, g._count._all]));
  const trainingTotal = trainingGroups.reduce((s, g) => s + g._count._all, 0);
  const trainingDone = trainingByStatus.get("COMPLETED") ?? 0;

  const genderTotal = genderGroups.reduce((s, g) => s + g._count._all, 0);

  const sections: ReportSection[] = [
    {
      heading: "CSR activities & participation",
      columns: ["Activity", "Department", "Date", "Points", "Participants", "Approved"],
      rows: activities.map((a) => {
        const appr = a.participations.filter((p) => p.approvalStatus === "APPROVED").length;
        return [
          a.title,
          a.department?.name ?? "Org-wide",
          fmtDate(a.activityDate),
          a.points,
          a.participations.length,
          appr,
        ];
      }),
    },
    {
      heading: "Training completion",
      columns: ["Status", "Count", "Share %"],
      rows: (["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const).map((st) => {
        const c = trainingByStatus.get(st) ?? 0;
        return [humanize(st), c, pct(c, trainingTotal)];
      }),
    },
    {
      heading: "Diversity · gender distribution",
      columns: ["Gender", "Employees", "Share %"],
      rows: genderGroups
        .map((g) => [humanize(g.gender), g._count._all, pct(g._count._all, genderTotal)] as (string | number)[])
        .sort((a, b) => Number(b[1]) - Number(a[1])),
    },
    {
      heading: "Participation status",
      columns: ["Status", "Count"],
      rows: (["APPROVED", "PENDING", "REJECTED"] as const).map((st) => [
        humanize(st),
        partByStatus.get(st) ?? 0,
      ]),
    },
  ];

  return {
    title: "Social Report",
    generatedAt: new Date(),
    sections,
    charts: [
      {
        type: "column",
        title: "CSR participation by status",
        data: [
          { label: "Approved", value: partByStatus.get("APPROVED") ?? 0, color: CHART.green },
          { label: "Pending", value: partByStatus.get("PENDING") ?? 0, color: CHART.amber },
          { label: "Rejected", value: partByStatus.get("REJECTED") ?? 0, color: CHART.red },
        ],
      },
      {
        type: "column",
        title: "Training completion",
        data: [
          { label: "Completed", value: trainingByStatus.get("COMPLETED") ?? 0, color: CHART.green },
          { label: "In progress", value: trainingByStatus.get("IN_PROGRESS") ?? 0, color: CHART.blue },
          { label: "Not started", value: trainingByStatus.get("NOT_STARTED") ?? 0, color: CHART.slate },
        ],
      },
      ...(genderTotal
        ? [
            {
              type: "proportion" as const,
              title: "Workforce gender distribution",
              data: genderGroups.map((g, i) => ({
                label: humanize(g.gender),
                value: g._count._all,
                color: [CHART.blue, CHART.green, CHART.purple, CHART.slate][i % 4],
              })),
            },
          ]
        : []),
    ],
    summary: {
      "CSR activities": activities.length,
      "Total participations": totalParticipations,
      "Approved participations": approved,
      "Approval rate %": pct(approved, totalParticipations),
      "Trainings completed": trainingDone,
      "Training completion %": pct(trainingDone, trainingTotal),
      "Points awarded": toNumber(pointsAgg._sum.pointsEarned),
    },
  };
}

// ----------------------------- Governance -----------------------------

export async function buildGovernanceReport(filters: ReportFilters): Promise<ReportDataset> {
  const { organizationId, departmentId } = filters;
  const deptWhere = departmentId ? { departmentId } : {};
  const range = dateRange(filters.from, filters.to);

  const [policies, audits, severityGroups, statusGroups, overdue] = await Promise.all([
    prisma.esgPolicy.findMany({
      where: { organizationId, ...deptWhere },
      include: {
        department: { select: { name: true } },
        acknowledgements: { select: { acknowledgementStatus: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.audit.findMany({
      where: { organizationId, ...deptWhere, ...(range ? { auditDate: range } : {}) },
      include: { department: { select: { name: true } } },
      orderBy: { auditDate: "desc" },
    }),
    prisma.complianceIssue.groupBy({
      by: ["severity"],
      _count: { _all: true },
      where: { organizationId, ...deptWhere },
    }),
    prisma.complianceIssue.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { organizationId, ...deptWhere },
    }),
    prisma.complianceIssue.count({ where: { organizationId, ...deptWhere, isOverdue: true } }),
  ]);

  const severityMap = new Map(severityGroups.map((g) => [g.severity, g._count._all]));
  const statusMap = new Map(statusGroups.map((g) => [g.status, g._count._all]));
  const totalIssues = statusGroups.reduce((s, g) => s + g._count._all, 0);
  const openIssues = (statusMap.get("OPEN") ?? 0) + (statusMap.get("IN_PROGRESS") ?? 0);
  const highCritical = (severityMap.get("HIGH") ?? 0) + (severityMap.get("CRITICAL") ?? 0);

  let ackTotalAll = 0;
  let ackDoneAll = 0;
  const policyRows = policies.map((p) => {
    const total = p.acknowledgements.length;
    const done = p.acknowledgements.filter((a) => a.acknowledgementStatus === "ACKNOWLEDGED").length;
    ackTotalAll += total;
    ackDoneAll += done;
    return [
      p.title,
      p.department?.name ?? "Org-wide",
      humanize(p.status),
      done,
      total - done,
      pct(done, total),
    ] as (string | number)[];
  });

  const sections: ReportSection[] = [
    {
      heading: "Policies & acknowledgement",
      columns: ["Policy", "Department", "Status", "Acknowledged", "Pending", "Ack %"],
      rows: policyRows,
    },
    {
      heading: "Audits",
      columns: ["Audit", "Type", "Department", "Date", "Score", "Status"],
      rows: audits.map((a) => [
        a.title,
        humanize(a.auditType),
        a.department?.name ?? "Org-wide",
        fmtDate(a.auditDate),
        a.score != null ? toNumber(a.score) : "—",
        humanize(a.status),
      ]),
    },
    {
      heading: "Compliance issues by severity",
      columns: ["Severity", "Count"],
      rows: (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((sv) => [
        humanize(sv),
        severityMap.get(sv) ?? 0,
      ]),
    },
    {
      heading: "Compliance issues by status",
      columns: ["Status", "Count"],
      rows: (["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((st) => [
        humanize(st),
        statusMap.get(st) ?? 0,
      ]),
    },
  ];

  return {
    title: "Governance Report",
    generatedAt: new Date(),
    sections,
    charts: [
      {
        type: "column",
        title: "Compliance issues by severity",
        data: [
          { label: "Low", value: severityMap.get("LOW") ?? 0, color: CHART.green },
          { label: "Medium", value: severityMap.get("MEDIUM") ?? 0, color: CHART.amber },
          { label: "High", value: severityMap.get("HIGH") ?? 0, color: CHART.orange },
          { label: "Critical", value: severityMap.get("CRITICAL") ?? 0, color: CHART.red },
        ],
      },
      {
        type: "column",
        title: "Compliance issues by status",
        data: [
          { label: "Open", value: statusMap.get("OPEN") ?? 0, color: CHART.red },
          { label: "In progress", value: statusMap.get("IN_PROGRESS") ?? 0, color: CHART.blue },
          { label: "Resolved", value: statusMap.get("RESOLVED") ?? 0, color: CHART.green },
          { label: "Closed", value: statusMap.get("CLOSED") ?? 0, color: CHART.slate },
        ],
      },
    ],
    summary: {
      Policies: policies.length,
      "Avg acknowledgement %": pct(ackDoneAll, ackTotalAll),
      Audits: audits.length,
      "Open issues": openIssues,
      "Overdue issues": overdue,
      "High/Critical issues": highCritical,
    },
  };
}

// ----------------------------- ESG summary -----------------------------

export async function buildEsgSummaryReport(filters: ReportFilters): Promise<ReportDataset> {
  const { organizationId } = filters;
  const [scores, deptScores, overdue] = await Promise.all([
    getOrganizationScores(organizationId),
    getDepartmentScores(organizationId),
    prisma.complianceIssue.count({ where: { organizationId, isOverdue: true } }),
  ]);

  const pillars: { key: "environmental" | "social" | "governance"; label: string }[] = [
    { key: "environmental", label: "Environmental" },
    { key: "social", label: "Social" },
    { key: "governance", label: "Governance" },
  ];

  const pillarRows = pillars.map((p) => {
    const score = scores[p.key].score;
    const weight = scores.weights[p.key];
    return [
      p.label,
      score,
      weight,
      Math.round(((score * weight) / 100) * 10) / 10,
    ] as (string | number)[];
  });
  pillarRows.push(["Overall (weighted)", scores.overall, 100, scores.overall]);

  const warnings: (string | number)[][] = [];
  if (overdue > 0) warnings.push(["Overdue compliance", `${overdue} issue(s) past due`]);
  for (const p of pillars) {
    if (scores[p.key].score < 50) {
      warnings.push([`Low ${p.label.toLowerCase()} score`, `${scores[p.key].score} / 100 — needs attention`]);
    }
  }
  const bottom = deptScores[deptScores.length - 1];
  if (bottom && bottom.scores.overall < 50) {
    warnings.push(["Lagging department", `${bottom.name} at ${bottom.scores.overall} / 100`]);
  }
  if (warnings.length === 0) warnings.push(["All clear", "No critical ESG warnings detected"]);

  const period =
    filters.from || filters.to
      ? `${fmtDate(filters.from)} → ${fmtDate(filters.to)}`
      : "Trailing 12 months";

  const sections: ReportSection[] = [
    {
      heading: "Pillar scores",
      columns: ["Pillar", "Score", "Weight %", "Weighted contribution"],
      rows: pillarRows,
    },
    {
      heading: "Department ranking",
      columns: ["Rank", "Department", "Environmental", "Social", "Governance", "Overall"],
      rows: deptScores.map((d, i) => [
        i + 1,
        d.name,
        d.scores.environmental.score,
        d.scores.social.score,
        d.scores.governance.score,
        d.scores.overall,
      ]),
    },
    {
      heading: "Key warnings",
      columns: ["Area", "Detail"],
      rows: warnings,
    },
  ];

  return {
    title: "ESG Summary Report",
    generatedAt: new Date(),
    sections,
    charts: [
      {
        type: "column",
        title: "ESG pillar scores (/100)",
        unit: "",
        data: [
          { label: "Environmental", value: scores.environmental.score, color: CHART.green },
          { label: "Social", value: scores.social.score, color: CHART.blue },
          { label: "Governance", value: scores.governance.score, color: CHART.purple },
          { label: "Overall", value: scores.overall, color: CHART.cyan },
        ],
      },
      ...(deptScores.length
        ? [
            {
              type: "column" as const,
              title: "Department ranking (overall score)",
              data: deptScores.map((d) => ({ label: d.name, value: d.scores.overall })),
            },
          ]
        : []),
    ],
    summary: {
      "Overall ESG score": scores.overall,
      Grade: scoreGrade(scores.overall),
      Environmental: scores.environmental.score,
      Social: scores.social.score,
      Governance: scores.governance.score,
      Period: period,
    },
  };
}

// ----------------------------- Custom -----------------------------

export async function buildCustomReport(filters: ReportFilters): Promise<ReportDataset> {
  const { organizationId, departmentId, employeeId, challengeId, esgCategory } = filters;
  const deptWhere = departmentId ? { departmentId } : {};
  const range = dateRange(filters.from, filters.to);
  const moduleKey = (filters.module ?? "environmental").toLowerCase();

  const appliedFilters: (string | number)[][] = [
    ["Module", moduleKey],
    ["Department", departmentId ?? "All"],
    ["From", fmtDate(filters.from)],
    ["To", fmtDate(filters.to)],
    ["Employee", employeeId ?? "All"],
    ["Challenge", challengeId ?? "All"],
    ["Category", esgCategory ?? "All"],
  ];

  let dataSection: ReportSection;
  const summary: Record<string, string | number> = {};

  if (moduleKey === "social") {
    const where: Prisma.CsrParticipationWhereInput = {
      activity: { organizationId, ...deptWhere, ...(esgCategory ? { categoryId: esgCategory } : {}) },
      ...(employeeId ? { employeeId } : {}),
      ...(range ? { joinedAt: range } : {}),
    };
    const rows = await prisma.csrParticipation.findMany({
      where,
      include: { activity: { select: { title: true } }, employee: { select: { name: true } } },
      orderBy: { joinedAt: "desc" },
      take: 500,
    });
    dataSection = {
      heading: "CSR participations",
      columns: ["Activity", "Employee", "Status", "Points", "Joined"],
      rows: rows.map((r) => [
        r.activity.title,
        r.employee.name,
        humanize(r.approvalStatus),
        r.pointsEarned,
        fmtDate(r.joinedAt),
      ]),
    };
    summary["Records"] = rows.length;
    summary["Points earned"] = rows.reduce((s, r) => s + r.pointsEarned, 0);
  } else if (moduleKey === "governance") {
    const where: Prisma.ComplianceIssueWhereInput = {
      organizationId,
      ...deptWhere,
      ...(employeeId ? { ownerId: employeeId } : {}),
      ...(range ? { createdAt: range } : {}),
    };
    const rows = await prisma.complianceIssue.findMany({
      where,
      include: { department: { select: { name: true } }, owner: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    dataSection = {
      heading: "Compliance issues",
      columns: ["Issue", "Department", "Severity", "Owner", "Status", "Due", "Overdue"],
      rows: rows.map((r) => [
        r.title,
        r.department?.name ?? "Org-wide",
        humanize(r.severity),
        r.owner?.name ?? "Unassigned",
        humanize(r.status),
        fmtDate(r.dueDate),
        r.isOverdue ? "Yes" : "No",
      ]),
    };
    summary["Records"] = rows.length;
    summary["Overdue"] = rows.filter((r) => r.isOverdue).length;
  } else if (moduleKey === "gamification") {
    const where: Prisma.ChallengeParticipationWhereInput = {
      challenge: {
        organizationId,
        ...deptWhere,
        ...(esgCategory ? { categoryId: esgCategory } : {}),
      },
      ...(challengeId ? { challengeId } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(range ? { joinedAt: range } : {}),
    };
    const rows = await prisma.challengeParticipation.findMany({
      where,
      include: { challenge: { select: { title: true } }, employee: { select: { name: true } } },
      orderBy: { joinedAt: "desc" },
      take: 500,
    });
    dataSection = {
      heading: "Challenge participations",
      columns: ["Challenge", "Employee", "Progress %", "Status", "XP awarded", "Joined"],
      rows: rows.map((r) => [
        r.challenge.title,
        r.employee.name,
        toNumber(r.progressPercentage),
        humanize(r.approvalStatus),
        r.xpAwarded,
        fmtDate(r.joinedAt),
      ]),
    };
    summary["Records"] = rows.length;
    summary["XP awarded"] = rows.reduce((s, r) => s + r.xpAwarded, 0);
  } else {
    // environmental (default)
    const where: Prisma.CarbonTransactionWhereInput = {
      organizationId,
      ...deptWhere,
      ...(employeeId ? { createdById: employeeId } : {}),
      ...(range ? { transactionDate: range } : {}),
    };
    const rows = await prisma.carbonTransaction.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: { transactionDate: "desc" },
      take: 500,
    });
    dataSection = {
      heading: "Carbon transactions",
      columns: ["Date", "Department", "Source", "Scope", "Quantity", "tCO₂e"],
      rows: rows.map((r) => [
        fmtDate(r.transactionDate),
        r.department?.name ?? "Unassigned",
        r.sourceType,
        SCOPE_LABEL[r.scope] ?? r.scope,
        toNumber(r.quantity),
        tonnes(r.co2eKg),
      ]),
    };
    summary["Records"] = rows.length;
    summary["Total tCO₂e"] = Math.round(rows.reduce((s, r) => s + tonnes(r.co2eKg), 0) * 100) / 100;
  }

  return {
    title: "Custom Report",
    generatedAt: new Date(),
    sections: [
      { heading: "Applied filters", columns: ["Filter", "Value"], rows: appliedFilters },
      dataSection,
    ],
    summary,
  };
}

// ----------------------------- dispatch -----------------------------

export type ReportKind =
  | "environmental"
  | "social"
  | "governance"
  | "esg-summary"
  | "custom";

/** Dispatch to the matching builder. Throws on an unknown type. */
export async function getReport(type: string, filters: ReportFilters): Promise<ReportDataset> {
  switch (type) {
    case "environmental":
      return buildEnvironmentalReport(filters);
    case "social":
      return buildSocialReport(filters);
    case "governance":
      return buildGovernanceReport(filters);
    case "esg-summary":
      return buildEsgSummaryReport(filters);
    case "custom":
      return buildCustomReport(filters);
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

// silence unused-import in strict builds when round1 is not referenced elsewhere
void round1;
