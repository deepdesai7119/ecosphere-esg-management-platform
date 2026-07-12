import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { BadgesClient } from "./badges-client";

export const metadata = { title: "Badges" };
export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const user = await requireUser();
  const badges = await prisma.badge.findMany({
    where: { organizationId: user.organizationId },
    include: { _count: { select: { employeeBadges: true } } },
    orderBy: { unlockThreshold: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Badges"
        description="Automatically awarded when employees hit XP, challenge, CSR or policy milestones."
        accentClassName="text-game"
        breadcrumbs={[{ label: "Gamification", href: "/gamification" }, { label: "Badges" }]}
      />
      <ModuleTabs groupHref="/gamification" module="gamification" />
      <BadgesClient data={JSON.parse(JSON.stringify(badges))} canManage={can(user.role, "badge.manage")} />
    </>
  );
}
