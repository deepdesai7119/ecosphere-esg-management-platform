import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { ComplianceClient } from "./compliance-client";

export const metadata = { title: "Compliance" };
export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const user = await requireUser();

  const [issues, users, departments, audits] = await Promise.all([
    prisma.complianceIssue.findMany({
      where: { organizationId: user.organizationId },
      include: {
        audit: { select: { title: true } },
        department: { select: { name: true } },
        owner: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
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
    prisma.audit.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Compliance"
        description="Raise, assign and resolve compliance issues before they fall overdue."
        accentClassName="text-gov"
        breadcrumbs={[{ label: "Governance", href: "/governance" }, { label: "Compliance" }]}
      />
      <ModuleTabs groupHref="/governance" module="governance" />
      <ComplianceClient
        data={JSON.parse(JSON.stringify(issues))}
        canManage={can(user.role, "compliance.manage")}
        users={users.map((u) => ({ label: u.name, value: u.id }))}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
        audits={audits.map((a) => ({ label: a.title, value: a.id }))}
      />
    </>
  );
}
