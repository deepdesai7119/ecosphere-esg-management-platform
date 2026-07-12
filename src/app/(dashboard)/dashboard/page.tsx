import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  HandHeart,
  Trophy,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getOrganizationScores, getDepartmentScores } from "@/server/services/score.service";
import {
  getEmissionsBreakdown,
  getScoreTrend,
  getEngagementStats,
  getRecentActivity,
} from "@/server/repositories/dashboard.repository";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ScoreCard } from "@/components/shared/score-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard, AreaTrend, LineTrend, BarCompare, DonutChart } from "@/components/charts";
import { ScoreExplainer } from "@/components/dashboard/score-explainer";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecalculateButton } from "@/components/dashboard/recalculate-button";
import { CHART_COLORS } from "@/lib/constants";
import { formatRelative, humanizeEnum } from "@/lib/format";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const orgId = user.organizationId;

  const [scores, deptScores, emissions, trend, stats, activity] = await Promise.all([
    getOrganizationScores(orgId),
    getDepartmentScores(orgId),
    getEmissionsBreakdown(orgId),
    getScoreTrend(orgId),
    getEngagementStats(orgId),
    getRecentActivity(orgId),
  ]);

  const pillars = [
    { key: "environmental", label: "Environmental", score: scores.environmental.score, weight: scores.weights.environmental, components: scores.environmental.components },
    { key: "social", label: "Social", score: scores.social.score, weight: scores.weights.social, components: scores.social.components },
    { key: "governance", label: "Governance", score: scores.governance.score, weight: scores.weights.governance, components: scores.governance.components },
  ];

  const deptRanking = deptScores.map((d) => ({ name: d.name, score: d.scores.overall }));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Executive overview of your organisation's ESG performance."
        actions={
          <div className="flex items-center gap-2">
            <ScoreExplainer overall={scores.overall} pillars={pillars} />
            {can(user.role, "score.recalculate") && <RecalculateButton />}
          </div>
        }
      />

      {/* Score cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label="Environmental Score" score={scores.environmental.score} accent="env" href="/environmental" />
        <ScoreCard label="Social Score" score={scores.social.score} accent="social" href="/social" />
        <ScoreCard label="Governance Score" score={scores.governance.score} accent="gov" href="/governance" />
        <ScoreCard label="Overall ESG Score" score={scores.overall} accent="slate" href="/reports/esg-summary" subtitle="Weighted across pillars" />
      </div>

      {/* Engagement stat tiles */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total emissions (12mo)" value={`${emissions.totalTonnes} t`} icon={Cloud} iconClassName="bg-env/10 text-env" hint="CO₂e across all scopes" />
        <StatCard label="CSR participation" value={`${stats.csrParticipationRate}%`} icon={HandHeart} iconClassName="bg-social/10 text-social" hint={`${stats.csrApproved} approved`} />
        <StatCard label="Policy acknowledgement" value={`${stats.policyAckRate}%`} icon={ClipboardCheck} iconClassName="bg-gov/10 text-gov" hint="Across published policies" />
        <StatCard
          label="Open compliance issues"
          value={stats.complianceOpen}
          icon={stats.complianceOverdue > 0 ? AlertTriangle : CheckCircle2}
          iconClassName={stats.complianceOverdue > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}
          hint={`${stats.complianceOverdue} overdue`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Emissions trend (12 months)" className="lg:col-span-2">
          <AreaTrend data={emissions.trend} xKey="month" series={[{ key: "tonnes", label: "tCO₂e", color: CHART_COLORS[0] }]} unit="t" />
        </ChartCard>
        <ChartCard title="Emissions by scope">
          <DonutChart data={emissions.byScope} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Department ESG ranking" className="lg:col-span-2">
          <BarCompare data={deptRanking} xKey="name" series={[{ key: "score", label: "Overall score" }]} colorByIndex />
        </ChartCard>
        <ChartCard title="ESG score trend">
          {trend.length > 0 ? (
            <LineTrend
              data={trend}
              xKey="month"
              series={[
                { key: "Environmental", label: "E", color: CHART_COLORS[0] },
                { key: "Social", label: "S", color: CHART_COLORS[1] },
                { key: "Governance", label: "G", color: CHART_COLORS[2] },
              ]}
            />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">No score history yet.</p>
          )}
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QuickActions role={user.role} />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5 text-sm">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-env" />
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-medium">{a.user}</span>{" "}
                        <span className="text-muted-foreground">{humanizeEnum(a.action).toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.entityType} · {formatRelative(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Challenge participation</CardTitle>
            <Trophy className="size-4 text-game" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">{stats.challengeParticipants}</span>
              <span className="text-sm text-muted-foreground">total joins</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.activeChallenges} active challenge{stats.activeChallenges === 1 ? "" : "s"} running now.
            </p>
            <Link
              href="/gamification/leaderboard"
              className="inline-flex items-center gap-1 text-sm font-medium text-game hover:underline"
            >
              View leaderboard →
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
