import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { TrainingClient } from "./training-client";

export const metadata = { title: "Training" };
export const dynamic = "force-dynamic";

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const { new: openNew } = await searchParams;

  const [trainings, departments, myCompletions] = await Promise.all([
    prisma.training.findMany({
      where: { organizationId: user.organizationId },
      include: {
        department: { select: { name: true } },
        _count: { select: { completions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.trainingCompletion.findMany({
      where: { employeeId: user.id, status: "COMPLETED", training: { organizationId: user.organizationId } },
      select: { trainingId: true },
    }),
  ]);

  const canManage = can(user.role, "training.manage");

  return (
    <>
      <PageHeader
        title="Training"
        description="Assigned learning modules — mark them complete to boost completion coverage."
        accentClassName="text-social"
        breadcrumbs={[{ label: "Social", href: "/social" }, { label: "Training" }]}
      />
      <ModuleTabs groupHref="/social" module="social" />
      <TrainingClient
        data={JSON.parse(JSON.stringify(trainings))}
        canManage={canManage}
        canComplete={can(user.role, "training.complete")}
        completedIds={myCompletions.map((c) => c.trainingId)}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
        autoOpen={openNew === "1" && canManage}
      />
    </>
  );
}
