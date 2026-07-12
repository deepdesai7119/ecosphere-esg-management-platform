import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { ProductsClient } from "./products-client";

export const metadata = { title: "Product Profiles" };
export const dynamic = "force-dynamic";

export default async function ProductProfilesPage() {
  const user = await requireUser();
  const products = await prisma.productEsgProfile.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Product ESG Profiles"
        description="Embodied carbon and material sustainability by product."
        accentClassName="text-env"
        breadcrumbs={[{ label: "Environmental", href: "/environmental" }, { label: "Product Profiles" }]}
      />
      <ModuleTabs groupHref="/environmental" module="environmental" />
      <ProductsClient
        data={JSON.parse(JSON.stringify(products))}
        canManage={can(user.role, "product.manage")}
      />
    </>
  );
}
