import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/auth/session";
import { getReport } from "@/server/services/report.service";
import { coerceFrom, coerceTo } from "@/lib/validations/reports";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { ReportFilters } from "./report-filters";
import { ExportButtons } from "./export-buttons";
import { DatasetView } from "./dataset-view";

export interface ReportSearchParams {
  departmentId?: string;
  from?: string;
  to?: string;
}

export async function TypedReport({
  type,
  title,
  description,
  user,
  searchParams,
}: {
  type: string;
  title: string;
  description: string;
  user: CurrentUser;
  searchParams: ReportSearchParams;
}) {
  const departments = await prisma.department.findMany({
    where: { organizationId: user.organizationId, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const dataset = await getReport(type, {
    organizationId: user.organizationId,
    departmentId: searchParams.departmentId || undefined,
    from: coerceFrom(searchParams.from),
    to: coerceTo(searchParams.to),
  });

  const canExport = can(user.role, "report.generate");

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: title }]}
        actions={
          canExport ? (
            <ExportButtons
              type={type}
              filters={{ departmentId: searchParams.departmentId, from: searchParams.from, to: searchParams.to }}
            />
          ) : undefined
        }
      />
      <ModuleTabs groupHref="/reports" />
      <ReportFilters departments={departments.map((d) => ({ label: d.name, value: d.id }))} />
      <DatasetView dataset={dataset} />
    </>
  );
}
