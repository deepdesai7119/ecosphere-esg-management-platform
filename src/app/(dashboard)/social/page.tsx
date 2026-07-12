import { HandHeart, Users, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard, BarCompare, DonutChart } from "@/components/charts";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Social" };
export const dynamic = "force-dynamic";

export default async function SocialOverviewPage() {
  const user = await requireUser();
  const orgId = user.organizationId;

  const [totalActivities, statusGroups, activeTrainings, categories, activityByCat] =
    await Promise.all([
      prisma.csrActivity.count({ where: { organizationId: orgId } }),
      prisma.csrParticipation.groupBy({
        by: ["approvalStatus"],
        where: { activity: { organizationId: orgId } },
        _count: { _all: true },
      }),
      prisma.training.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
      prisma.category.findMany({
        where: { organizationId: orgId, type: "CSR_ACTIVITY" },
        select: { id: true, name: true },
      }),
      prisma.csrActivity.groupBy({
        by: ["categoryId"],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
    ]);

  const countFor = (s: string) =>
    statusGroups.find((g) => g.approvalStatus === s)?._count._all ?? 0;
  const approved = countFor("APPROVED");
  const pending = countFor("PENDING");
  const rejected = countFor("REJECTED");
  const totalParticipation = approved + pending + rejected;
  const rate = totalParticipation ? (approved / totalParticipation) * 100 : 0;

  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const byCategory = activityByCat
    .map((g) => ({
      category: g.categoryId ? catName.get(g.categoryId) ?? "Other" : "Uncategorized",
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const statusData = [
    { name: "Approved", value: approved, color: "#16a34a" },
    { name: "Pending", value: pending, color: "#f59e0b" },
    { name: "Rejected", value: rejected, color: "#dc2626" },
  ];

  return (
    <>
      <PageHeader
        title="Social"
        description="CSR activities, participation, diversity and workforce training."
        accentClassName="text-social"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Social" }]}
      />
      <ModuleTabs groupHref="/social" module="social" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="CSR activities" value={totalActivities} icon={HandHeart} iconClassName="bg-social/10 text-social" />
        <StatCard label="Participation rate" value={formatPercent(rate)} hint={`${approved} of ${totalParticipation} approved`} icon={Users} iconClassName="bg-social/10 text-social" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} iconClassName="bg-success/10 text-success" />
        <StatCard label="Pending review" value={pending} icon={Clock} iconClassName="bg-warning/10 text-warning" />
        <StatCard label="Active trainings" value={activeTrainings} icon={GraduationCap} iconClassName="bg-social/10 text-social" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="CSR activities by category" className="lg:col-span-2">
          {byCategory.length ? (
            <BarCompare
              data={byCategory}
              xKey="category"
              series={[{ key: "count", label: "Activities" }]}
              colorByIndex
            />
          ) : (
            <EmptyState title="No CSR activities yet" description="Create activities to see category breakdowns." />
          )}
        </ChartCard>
        <ChartCard title="Participation status">
          {totalParticipation ? (
            <DonutChart data={statusData} />
          ) : (
            <EmptyState title="No participation yet" description="Employees haven't joined activities yet." />
          )}
        </ChartCard>
      </div>
    </>
  );
}
