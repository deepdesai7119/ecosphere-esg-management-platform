import { Users, Building2, GraduationCap, UserSquare2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatPercent, humanizeEnum } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard, BarCompare, DonutChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Diversity & Inclusion" };
export const dynamic = "force-dynamic";

export default async function DiversityPage() {
  const user = await requireUser();
  const orgId = user.organizationId;

  const [headcount, genderGroups, employmentGroups, departments, totalCompletions, completedCompletions] =
    await Promise.all([
      prisma.user.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
      prisma.employeeProfile.groupBy({
        by: ["gender"],
        where: { user: { organizationId: orgId } },
        _count: { _all: true },
      }),
      prisma.employeeProfile.groupBy({
        by: ["employmentType"],
        where: { user: { organizationId: orgId } },
        _count: { _all: true },
      }),
      prisma.department.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        select: { name: true, _count: { select: { members: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.trainingCompletion.count({ where: { training: { organizationId: orgId } } }),
      prisma.trainingCompletion.count({
        where: { training: { organizationId: orgId }, status: "COMPLETED" },
      }),
    ]);

  const genderData = genderGroups.map((g) => ({
    name: humanizeEnum(g.gender),
    value: g._count._all,
  }));
  const employmentData = employmentGroups.map((g) => ({
    name: humanizeEnum(g.employmentType),
    value: g._count._all,
  }));
  const deptData = departments.map((d) => ({ department: d.name, count: d._count.members }));

  const totalProfiles = genderGroups.reduce((s, g) => s + g._count._all, 0);
  const femaleCount = genderGroups.find((g) => g.gender === "FEMALE")?._count._all ?? 0;
  const femaleShare = totalProfiles ? (femaleCount / totalProfiles) * 100 : 0;
  const completionRate = totalCompletions ? (completedCompletions / totalCompletions) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Diversity & Inclusion"
        description="Aggregated workforce demographics and training coverage — no individual data is shown."
        accentClassName="text-social"
        breadcrumbs={[{ label: "Social", href: "/social" }, { label: "Diversity" }]}
      />
      <ModuleTabs groupHref="/social" module="social" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active employees" value={headcount} icon={Users} iconClassName="bg-social/10 text-social" />
        <StatCard label="Departments" value={departments.length} icon={Building2} iconClassName="bg-social/10 text-social" />
        <StatCard label="Female representation" value={formatPercent(femaleShare)} icon={UserSquare2} iconClassName="bg-social/10 text-social" />
        <StatCard label="Training completion" value={formatPercent(completionRate)} icon={GraduationCap} iconClassName="bg-social/10 text-social" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Gender distribution">
          {genderData.length ? (
            <DonutChart data={genderData} />
          ) : (
            <EmptyState title="No profile data" description="Employee profiles are not set up yet." />
          )}
        </ChartCard>
        <ChartCard title="Employment type">
          {employmentData.length ? (
            <DonutChart data={employmentData} />
          ) : (
            <EmptyState title="No profile data" description="Employee profiles are not set up yet." />
          )}
        </ChartCard>
        <ChartCard title="Headcount by department">
          {deptData.length ? (
            <BarCompare data={deptData} xKey="department" series={[{ key: "count", label: "Employees" }]} colorByIndex />
          ) : (
            <EmptyState title="No departments" />
          )}
        </ChartCard>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Training completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <Progress value={completionRate} className="h-2" />
            <span className="w-32 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {completedCompletions} / {totalCompletions} · {formatPercent(completionRate)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Share of assigned trainings that have been completed across the organisation.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
