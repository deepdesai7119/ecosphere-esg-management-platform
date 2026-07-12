import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatDate, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard, DonutChart } from "@/components/charts";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Governance" };
export const dynamic = "force-dynamic";

const SEVERITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#16a34a",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};

export default async function GovernanceOverviewPage() {
  const user = await requireUser();
  const orgId = user.organizationId;
  const canManage = can(user.role, "compliance.manage");

  const [publishedCount, ackTotal, ackDone, auditCount, issues] = await Promise.all([
    prisma.esgPolicy.count({ where: { organizationId: orgId, status: "PUBLISHED" } }),
    prisma.policyAcknowledgement.count({ where: { policy: { organizationId: orgId } } }),
    prisma.policyAcknowledgement.count({
      where: { policy: { organizationId: orgId }, acknowledgementStatus: "ACKNOWLEDGED" },
    }),
    prisma.audit.count({ where: { organizationId: orgId } }),
    prisma.complianceIssue.findMany({
      where: { organizationId: orgId },
      include: {
        owner: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const ackRate = ackTotal === 0 ? 0 : (ackDone / ackTotal) * 100;
  const openCount = issues.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;
  const overdue = issues.filter((i) => i.isOverdue);

  const severityData = SEVERITY_ORDER.map((s) => ({
    name: s.charAt(0) + s.slice(1).toLowerCase(),
    value: issues.filter((i) => i.severity === s).length,
    color: SEVERITY_COLORS[s],
  }));

  return (
    <>
      <PageHeader
        title="Governance"
        description="Policies, acknowledgements, audits and compliance oversight."
        accentClassName="text-gov"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Governance" }]}
        actions={
          canManage ? (
            <ActionButton
              endpoint="/api/jobs/check-overdue-compliance"
              method="post"
              label="Run Compliance Check"
              variant="outline"
              successMessage="Compliance check complete."
            />
          ) : undefined
        }
      />
      <ModuleTabs groupHref="/governance" module="governance" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Published policies" value={publishedCount} icon={FileText} iconClassName="bg-gov/10 text-gov" />
        <StatCard label="Acknowledgement rate" value={formatPercent(ackRate)} icon={CheckCircle2} iconClassName="bg-gov/10 text-gov" />
        <StatCard label="Audits" value={auditCount} icon={ClipboardCheck} iconClassName="bg-gov/10 text-gov" />
        <StatCard label="Open issues" value={openCount} icon={ShieldAlert} iconClassName="bg-gov/10 text-gov" />
        <StatCard
          label="Overdue issues"
          value={<span className={overdue.length > 0 ? "text-danger" : undefined}>{overdue.length}</span>}
          icon={AlertTriangle}
          iconClassName={overdue.length > 0 ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Compliance issues by severity">
          <DonutChart data={severityData} />
        </ChartCard>

        {canManage && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-danger" />
              Overdue compliance issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nothing overdue"
                description="All compliance issues are within their due dates."
              />
            ) : (
              <ul className="divide-y">
                {overdue.slice(0, 6).map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.owner?.name ?? "Unassigned"} · {i.department?.name ?? "Org-wide"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={i.severity} />
                      <span className="text-xs font-medium text-danger tabular-nums">
                        Due {formatDate(i.dueDate)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </>
  );
}
