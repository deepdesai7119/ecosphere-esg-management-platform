import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { AcknowledgementsClient } from "./acknowledgements-client";

export const metadata = { title: "Acknowledgements" };
export const dynamic = "force-dynamic";

export default async function AcknowledgementsPage() {
  const user = await requireUser();
  const canManage = can(user.role, "policy.manage");

  const allAcksQuery: Prisma.PolicyAcknowledgementFindManyArgs = {
    where: { policy: { organizationId: user.organizationId } },
    include: {
      employee: { select: { name: true } },
      policy: { select: { title: true, code: true } },
    },
    orderBy: [{ acknowledgementStatus: "asc" }, { updatedAt: "desc" }],
  };

  const [myPending, allAcks] = await Promise.all([
    prisma.policyAcknowledgement.findMany({
      where: {
        employeeId: user.id,
        acknowledgementStatus: "PENDING",
        policy: { status: "PUBLISHED" },
      },
      include: {
        policy: { select: { id: true, title: true, code: true, acknowledgementDueDate: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    canManage ? prisma.policyAcknowledgement.findMany(allAcksQuery) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Acknowledgements"
        description="Track policy acknowledgement across the organisation and confirm your own."
        accentClassName="text-gov"
        breadcrumbs={[{ label: "Governance", href: "/governance" }, { label: "Acknowledgements" }]}
      />
      <ModuleTabs groupHref="/governance" module="governance" />
      <AcknowledgementsClient
        myPending={JSON.parse(JSON.stringify(myPending))}
        allAcks={JSON.parse(JSON.stringify(allAcks))}
        canManage={canManage}
      />
    </>
  );
}
