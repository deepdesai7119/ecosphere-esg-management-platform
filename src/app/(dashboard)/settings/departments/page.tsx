import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { DepartmentsClient } from "./departments-client";

export const metadata = { title: "Departments" };
export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const user = await requireUser();
  const [departments, users] = await Promise.all([
    prisma.department.findMany({
      where: { organizationId: user.organizationId },
      include: { head: { select: { name: true } }, parent: { select: { name: true } }, _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Departments"
        description="Organisational units used to scope ESG data and performance."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Departments" }]}
      />
      <ModuleTabs groupHref="/settings" />
      <DepartmentsClient
        data={JSON.parse(JSON.stringify(departments))}
        canManage={can(user.role, "department.manage")}
        users={users.map((u) => ({ label: u.name, value: u.id }))}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
      />
    </>
  );
}
