import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { FactorsClient } from "./factors-client";

export const metadata = { title: "Emission Factors" };
export const dynamic = "force-dynamic";

export default async function EmissionFactorsPage() {
  const user = await requireUser();
  const factors = await prisma.emissionFactor.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Emission Factors"
        description="Reference factors used to convert activity data into CO₂e."
        accentClassName="text-env"
        breadcrumbs={[{ label: "Environmental", href: "/environmental" }, { label: "Emission Factors" }]}
      />
      <ModuleTabs groupHref="/environmental" module="environmental" />
      <FactorsClient
        data={JSON.parse(JSON.stringify(factors))}
        canManage={can(user.role, "factor.manage")}
      />
    </>
  );
}
