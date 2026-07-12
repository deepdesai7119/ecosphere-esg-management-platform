import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { UsersClient } from "./users-client";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await requireUser();
  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true, email: true, role: true, status: true, departmentId: true, department: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
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
        title="Users"
        description="Manage accounts, roles and department assignments."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Users" }]}
      />
      <ModuleTabs groupHref="/settings" />
      <UsersClient
        data={JSON.parse(JSON.stringify(users))}
        canManage={can(user.role, "user.manage")}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
      />
    </>
  );
}
