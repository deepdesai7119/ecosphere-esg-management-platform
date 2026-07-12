import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { LeaderboardClient } from "./leaderboard-client";

export const metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await requireUser();

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        totalXp: true,
        completedChallengeCount: true,
        department: { select: { name: true } },
        _count: { select: { badges: true, csrParticipations: true } },
      },
      orderBy: { totalXp: "desc" },
    }),
    prisma.department.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    department: u.department?.name ?? "—",
    totalXp: u.totalXp,
    completedChallengeCount: u.completedChallengeCount,
    badges: u._count.badges,
    csr: u._count.csrParticipations,
  }));

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Ranked by total XP earned across challenges and CSR activities."
        accentClassName="text-game"
        breadcrumbs={[{ label: "Gamification", href: "/gamification" }, { label: "Leaderboard" }]}
      />
      <ModuleTabs groupHref="/gamification" module="gamification" />
      <LeaderboardClient rows={rows} departments={departments.map((d) => ({ label: d.name, value: d.id }))} />
    </>
  );
}
