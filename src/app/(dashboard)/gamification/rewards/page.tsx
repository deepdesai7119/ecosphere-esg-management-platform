import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { RewardsClient } from "./rewards-client";

export const metadata = { title: "Rewards" };
export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const user = await requireUser();
  const canManage = can(user.role, "redemption.process");

  const [rewards, me, redemptions] = await Promise.all([
    prisma.reward.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { pointsRequired: "asc" },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { availablePoints: true } }),
    canManage
      ? prisma.rewardRedemption.findMany({
          where: { reward: { organizationId: user.organizationId } },
          include: { reward: { select: { name: true } }, employee: { select: { name: true } } },
          orderBy: { redeemedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Rewards"
        description="Redeem points earned from challenges and CSR activities."
        accentClassName="text-game"
        breadcrumbs={[{ label: "Gamification", href: "/gamification" }, { label: "Rewards" }]}
      />
      <ModuleTabs groupHref="/gamification" module="gamification" />
      <RewardsClient
        rewards={JSON.parse(JSON.stringify(rewards))}
        availablePoints={me?.availablePoints ?? 0}
        canManage={canManage || can(user.role, "reward.manage")}
        canRedeem={can(user.role, "reward.redeem")}
        redemptions={JSON.parse(JSON.stringify(redemptions))}
      />
    </>
  );
}
