import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { ParticipationClient } from "./participation-client";

export const metadata = { title: "CSR Participation" };
export const dynamic = "force-dynamic";

export default async function ParticipationPage() {
  const user = await requireUser();
  const orgId = user.organizationId;
  const canApprove = can(user.role, "csr.approve");

  const [queue, mine] = await Promise.all([
    canApprove
      ? prisma.csrParticipation.findMany({
          where: { activity: { organizationId: orgId } },
          include: {
            employee: { select: { name: true } },
            activity: { select: { title: true, points: true, evidenceRequired: true } },
          },
          orderBy: [{ approvalStatus: "asc" }, { joinedAt: "desc" }],
        })
      : Promise.resolve([]),
    prisma.csrParticipation.findMany({
      where: { employeeId: user.id, activity: { organizationId: orgId } },
      include: {
        activity: { select: { title: true, points: true, evidenceRequired: true } },
      },
      orderBy: { joinedAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="CSR Participation"
        description="Review employee submissions and track your own CSR contributions."
        accentClassName="text-social"
        breadcrumbs={[{ label: "Social", href: "/social" }, { label: "Participation" }]}
      />
      <ModuleTabs groupHref="/social" module="social" />
      <ParticipationClient
        queue={JSON.parse(JSON.stringify(queue))}
        mine={JSON.parse(JSON.stringify(mine))}
        canApprove={canApprove}
      />
    </>
  );
}
