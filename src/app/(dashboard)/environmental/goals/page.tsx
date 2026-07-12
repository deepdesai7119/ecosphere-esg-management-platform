import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { GoalsClient } from "./goals-client";

export const metadata = { title: "Environmental Goals" };
export const dynamic = "force-dynamic";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const { new: openNew } = await searchParams;

  const [goals, departments] = await Promise.all([
    prisma.environmentalGoal.findMany({
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
        title="Environmental Goals"
        description="Track reduction targets against baseline and current performance."
        accentClassName="text-env"
        breadcrumbs={[{ label: "Environmental", href: "/environmental" }, { label: "Goals" }]}
      />
      <ModuleTabs groupHref="/environmental" module="environmental" />
      <GoalsClient
        data={JSON.parse(JSON.stringify(goals))}
        canManage={can(user.role, "goal.manage")}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
        autoOpen={openNew === "1" && can(user.role, "goal.manage")}
      />
    </>
  );
}
