import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { ActivitiesClient } from "./activities-client";

export const metadata = { title: "CSR Activities" };
export const dynamic = "force-dynamic";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const { new: openNew } = await searchParams;

  const [activities, categories, departments, myParticipations] = await Promise.all([
    prisma.csrActivity.findMany({
      where: { organizationId: user.organizationId },
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } },
        _count: { select: { participations: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { organizationId: user.organizationId, type: "CSR_ACTIVITY", status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.csrParticipation.findMany({
      where: { employeeId: user.id, activity: { organizationId: user.organizationId } },
      select: { activityId: true },
    }),
  ]);

  const canManage = can(user.role, "csr.manage");

  return (
    <>
      <PageHeader
        title="CSR Activities"
        description="Volunteering and community initiatives employees can join to earn points."
        accentClassName="text-social"
        breadcrumbs={[{ label: "Social", href: "/social" }, { label: "CSR Activities" }]}
      />
      <ModuleTabs groupHref="/social" module="social" />
      <ActivitiesClient
        data={JSON.parse(JSON.stringify(activities))}
        canManage={canManage}
        canJoin={can(user.role, "csr.join")}
        joinedIds={myParticipations.map((p) => p.activityId)}
        categories={categories.map((c) => ({ label: c.name, value: c.id }))}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
        autoOpen={openNew === "1" && canManage}
      />
    </>
  );
}
