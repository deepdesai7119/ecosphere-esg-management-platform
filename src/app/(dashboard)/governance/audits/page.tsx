import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { AuditsClient } from "./audits-client";

export const metadata = { title: "Audits" };
export const dynamic = "force-dynamic";

export default async function AuditsPage() {
  const user = await requireUser();

  const [audits, users, departments] = await Promise.all([
    prisma.audit.findMany({
      where: { organizationId: user.organizationId },
      include: {
        department: { select: { name: true } },
        auditor: { select: { name: true } },
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
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
        title="Audits"
        description="Plan and record internal, external, vendor and regulatory audits."
        accentClassName="text-gov"
        breadcrumbs={[{ label: "Governance", href: "/governance" }, { label: "Audits" }]}
      />
      <ModuleTabs groupHref="/governance" module="governance" />
      <AuditsClient
        data={JSON.parse(JSON.stringify(audits))}
        canManage={can(user.role, "audit.manage")}
        users={users.map((u) => ({ label: u.name, value: u.id }))}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
      />
    </>
  );
}
