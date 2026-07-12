import Link from "next/link";
import { Flag, Users, Award, Crown } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, formatNumber, initials } from "@/lib/format";
import { BadgeIcon, DifficultyBadge, badgeRule } from "./_lib/ui";

export const metadata = { title: "Gamification" };
export const dynamic = "force-dynamic";

export default async function GamificationOverviewPage() {
  const user = await requireUser();
  const orgId = user.organizationId;

  const [activeChallenges, totalJoins, badgesAvailable, topUsers, badges, activeCards] =
    await Promise.all([
      prisma.challenge.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
      prisma.challengeParticipation.count({ where: { challenge: { organizationId: orgId } } }),
      prisma.badge.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
      prisma.user.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          totalXp: true,
          completedChallengeCount: true,
          department: { select: { name: true } },
        },
        orderBy: { totalXp: "desc" },
        take: 5,
      }),
      prisma.badge.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        include: { _count: { select: { employeeBadges: true } } },
        orderBy: { unlockThreshold: "asc" },
        take: 8,
      }),
      prisma.challenge.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        include: {
          category: { select: { name: true } },
          _count: { select: { participations: true } },
        },
        orderBy: { deadline: "asc" },
        take: 6,
      }),
    ]);

  const topUser = topUsers[0];

  return (
    <>
      <PageHeader
        title="Gamification"
        description="Challenges, badges, rewards and the employee engagement leaderboard."
        accentClassName="text-game"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Gamification" }]}
      />
      <ModuleTabs groupHref="/gamification" module="gamification" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active challenges" value={activeChallenges} icon={Flag} iconClassName="bg-game/10 text-game" />
        <StatCard label="Total joins" value={totalJoins} icon={Users} iconClassName="bg-game/10 text-game" />
        <StatCard label="Badges available" value={badgesAvailable} icon={Award} iconClassName="bg-game/10 text-game" />
        <StatCard
          label="Top XP employee"
          value={topUser ? formatNumber(topUser.totalXp, 0) : "—"}
          hint={topUser?.name}
          icon={Crown}
          iconClassName="bg-game/10 text-game"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Mini leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Top performers</CardTitle>
            <Link href="/gamification/leaderboard" className="text-xs font-medium text-game hover:underline">
              Full leaderboard →
            </Link>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No employees yet.</p>
            ) : (
              <ul className="divide-y">
                {topUsers.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <Avatar size="sm">
                      {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                      <AvatarFallback>{initials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.department?.name ?? "Org-wide"} · {u.completedChallengeCount} completed
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-game">
                      {formatNumber(u.totalXp, 0)} XP
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Badge gallery preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Badges</CardTitle>
            <Link href="/gamification/badges" className="text-xs font-medium text-game hover:underline">
              All badges →
            </Link>
          </CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No badges configured.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {badges.map((b) => (
                  <div key={b.id} className="flex flex-col items-center gap-1 text-center" title={badgeRule(b.unlockMetric, b.unlockThreshold)}>
                    <span className="grid size-11 place-items-center rounded-full bg-game/10 text-game">
                      <BadgeIcon name={b.icon} />
                    </span>
                    <span className="line-clamp-1 text-[11px] text-muted-foreground">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active challenges */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Active challenges</CardTitle>
          <Link href="/gamification/challenges" className="text-xs font-medium text-game hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {activeCards.length === 0 ? (
            <EmptyState icon={Flag} title="No active challenges" description="Published challenges appear here." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeCards.map((c) => (
                <div key={c.id} className="rounded-lg border p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">{c.title}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.category?.name ?? "General"}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-game">{formatNumber(c.xp, 0)} XP</span>
                    <DifficultyBadge difficulty={c.difficulty} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c._count.participations} joined
                    {c.deadline ? ` · due ${formatDate(c.deadline)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
