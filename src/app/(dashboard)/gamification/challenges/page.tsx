import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { ChallengesClient } from "./challenges-client";

export const metadata = { title: "Challenges" };
export const dynamic = "force-dynamic";

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const { new: openNew } = await searchParams;

  const [challenges, categories, departments, goals, myParts] = await Promise.all([
    prisma.challenge.findMany({
      where: { organizationId: user.organizationId },
      include: {
        category: { select: { name: true, icon: true } },
        goal: { select: { name: true, unit: true } },
        _count: { select: { participations: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { organizationId: user.organizationId, type: "CHALLENGE", status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.environmentalGoal.findMany({
      where: { organizationId: user.organizationId, status: { not: "COMPLETED" } },
      select: { id: true, name: true, unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.challengeParticipation.findMany({
      where: { employeeId: user.id },
      select: { challengeId: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Challenges"
        description="Sustainability challenges progress through Draft → Active → Under Review → Completed."
        accentClassName="text-game"
        breadcrumbs={[{ label: "Gamification", href: "/gamification" }, { label: "Challenges" }]}
      />
      <ModuleTabs groupHref="/gamification" module="gamification" />
      <ChallengesClient
        data={JSON.parse(JSON.stringify(challenges))}
        canManage={can(user.role, "challenge.manage")}
        canJoin={can(user.role, "challenge.join")}
        joinedIds={myParts.map((p) => p.challengeId)}
        categories={categories.map((c) => ({ label: c.name, value: c.id }))}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
        goals={goals.map((g) => ({ label: `${g.name} (${g.unit})`, value: g.id }))}
        autoOpen={openNew === "1" && can(user.role, "challenge.manage")}
      />
    </>
  );
}
