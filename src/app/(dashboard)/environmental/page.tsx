import { Cloud, Factory, Target, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getEmissionsBreakdown } from "@/server/repositories/dashboard.repository";
import { goalProgress } from "@/lib/esg/scoring";
import { toNumber, formatNumber, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard, AreaTrend, DonutChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { CHART_COLORS } from "@/lib/constants";

export const metadata = { title: "Environmental" };
export const dynamic = "force-dynamic";

export default async function EnvironmentalOverviewPage() {
  const user = await requireUser();
  const orgId = user.organizationId;

  const [emissions, goals, factorCount, opCount] = await Promise.all([
    getEmissionsBreakdown(orgId),
    prisma.environmentalGoal.findMany({
      where: { organizationId: orgId },
      include: { department: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.emissionFactor.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
    prisma.businessOperation.count({ where: { organizationId: orgId } }),
  ]);

  const scope1 = emissions.byScope[0].value;
  const scope2 = emissions.byScope[1].value;
  const scope3 = emissions.byScope[2].value;

  return (
    <>
      <PageHeader
        title="Environmental"
        description="Emission tracking, product footprints and reduction goals."
        accentClassName="text-env"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Environmental" }]}
      />
      <ModuleTabs groupHref="/environmental" module="environmental" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total emissions (12mo)" value={`${emissions.totalTonnes} t`} icon={Cloud} iconClassName="bg-env/10 text-env" />
        <StatCard label="Scope 1 · Direct" value={`${formatNumber(scope1)} t`} icon={Factory} iconClassName="bg-env/10 text-env" />
        <StatCard label="Scope 2 · Energy" value={`${formatNumber(scope2)} t`} icon={Zap} iconClassName="bg-env/10 text-env" />
        <StatCard label="Scope 3 · Value chain" value={`${formatNumber(scope3)} t`} icon={Target} iconClassName="bg-env/10 text-env" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Monthly emissions (tCO₂e)" className="lg:col-span-2">
          <AreaTrend data={emissions.trend} xKey="month" series={[{ key: "tonnes", label: "tCO₂e", color: CHART_COLORS[0] }]} unit="t" />
        </ChartCard>
        <ChartCard title="Emissions by scope">
          <DonutChart data={emissions.byScope} />
        </ChartCard>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Environmental goals · target vs actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No goals yet.</p>
          ) : (
            goals.map((g) => {
              const progress = goalProgress(
                toNumber(g.currentValue),
                toNumber(g.baselineValue),
                toNumber(g.targetValue),
              );
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{g.name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{g.department?.name ?? "Org-wide"}</span>
                      <StatusBadge status={g.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={progress} className="h-2" />
                    <span className="w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatNumber(g.currentValue)} / {formatNumber(g.targetValue)} {g.unit} · {formatPercent(progress)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <p className="pt-1 text-xs text-muted-foreground">
            {factorCount} active emission factors · {opCount} business operations logged.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
