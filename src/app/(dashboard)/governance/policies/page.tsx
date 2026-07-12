import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { PoliciesClient } from "./policies-client";

export const metadata = { title: "Policies" };
export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const user = await requireUser();

  const [policies, departments] = await Promise.all([
    prisma.esgPolicy.findMany({
      where: { organizationId: user.organizationId },
      include: { department: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Policies"
        description="Publish governance policies and require employee acknowledgement."
        accentClassName="text-gov"
        breadcrumbs={[{ label: "Governance", href: "/governance" }, { label: "Policies" }]}
      />
      <ModuleTabs groupHref="/governance" module="governance" />
      <PoliciesClient
        data={JSON.parse(JSON.stringify(policies))}
        canManage={can(user.role, "policy.manage")}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
      />
    </>
  );
}
