import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { CategoriesClient } from "./categories-client";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await prisma.category.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description="Tags for CSR activities, challenges, ESG data and training."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Categories" }]}
      />
      <ModuleTabs groupHref="/settings" />
      <CategoriesClient data={JSON.parse(JSON.stringify(categories))} canManage={can(user.role, "category.manage")} />
    </>
  );
}
