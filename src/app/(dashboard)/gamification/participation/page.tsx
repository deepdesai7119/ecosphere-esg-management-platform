import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { ChallengeParticipationClient } from "./participation-client";

export const metadata = { title: "Challenge Participation" };
export const dynamic = "force-dynamic";

export default async function ChallengeParticipationPage() {
  const user = await requireUser();
  const canApprove = can(user.role, "challenge.approve");

  const parts = await prisma.challengeParticipation.findMany({
    where: canApprove
      ? { challenge: { organizationId: user.organizationId } }
      : { employeeId: user.id },
    include: {
      challenge: { select: { title: true, xp: true, evidenceRequired: true } },
      employee: { select: { name: true } },
    },
    orderBy: [{ approvalStatus: "asc" }, { joinedAt: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Challenge Participation"
        description={canApprove ? "Review and approve challenge submissions." : "Your challenge submissions and progress."}
        accentClassName="text-game"
        breadcrumbs={[{ label: "Gamification", href: "/gamification" }, { label: "Participation" }]}
      />
      <ModuleTabs groupHref="/gamification" module="gamification" />
      <ChallengeParticipationClient
        data={JSON.parse(JSON.stringify(parts))}
        canApprove={canApprove}
        currentUserId={user.id}
      />
    </>
  );
}
