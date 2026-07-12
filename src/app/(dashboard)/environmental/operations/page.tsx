import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { getEsgConfig } from "@/server/services/config.service";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { OperationsClient } from "./operations-client";

export const metadata = { title: "Business Operations" };
export const dynamic = "force-dynamic";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const { new: openNew } = await searchParams;

  const [operations, departments, factors, config] = await Promise.all([
    prisma.businessOperation.findMany({
      where: { organizationId: user.organizationId },
      include: {
        department: { select: { name: true } },
        emissionFactor: { select: { name: true, scope: true } },
        carbonTransaction: { select: { id: true, co2eKg: true } },
      },
      orderBy: { operationDate: "desc" },
    }),
    prisma.department.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.emissionFactor.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getEsgConfig(user.organizationId),
  ]);

  return (
    <>
      <PageHeader
        title="Business Operations"
        description="Log purchase, manufacturing, fleet and expense activity — carbon transactions are auto-generated."
        accentClassName="text-env"
        breadcrumbs={[{ label: "Environmental", href: "/environmental" }, { label: "Operations" }]}
      />
      <ModuleTabs groupHref="/environmental" module="environmental" />
      <OperationsClient
        data={JSON.parse(JSON.stringify(operations))}
        canManage={can(user.role, "operation.manage")}
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
        factors={factors.map((f) => ({ label: f.name, value: f.id }))}
        autoOpen={openNew === "1" && can(user.role, "operation.manage")}
        autoCalc={config.autoEmissionCalculationEnabled}
      />
    </>
  );
}
