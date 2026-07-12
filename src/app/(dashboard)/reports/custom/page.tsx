import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { CustomBuilder } from "./custom-builder";

export const metadata = { title: "Custom Report Builder" };
export const dynamic = "force-dynamic";

export default async function CustomReportPage() {
  const user = await requireCapability("report.generate");
  const [departments, employees, challenges, categories] = await Promise.all([
    prisma.department.findMany({ where: { organizationId: user.organizationId, status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { organizationId: user.organizationId, status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.challenge.findMany({ where: { organizationId: user.organizationId }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { organizationId: user.organizationId, type: "ESG" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Custom Report Builder" description="Filter across modules and export the result. Filters persist in the URL." />
      <ModuleTabs groupHref="/reports" />
      <CustomBuilder
        departments={departments.map((d) => ({ label: d.name, value: d.id }))}
        employees={employees.map((e) => ({ label: e.name, value: e.id }))}
        challenges={challenges.map((c) => ({ label: c.title, value: c.id }))}
        categories={categories.map((c) => ({ label: c.name, value: c.id }))}
      />
    </>
  );
}
