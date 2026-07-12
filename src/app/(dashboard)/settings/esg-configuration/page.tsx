import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { getEsgConfig } from "@/server/services/config.service";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { ConfigForm } from "./config-form";

export const metadata = { title: "ESG Configuration" };
export const dynamic = "force-dynamic";

export default async function EsgConfigurationPage() {
  const user = await requireUser();
  const config = await getEsgConfig(user.organizationId);

  return (
    <>
      <PageHeader
        title="ESG Configuration"
        description="Scoring weights and platform-wide automation rules."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "ESG Configuration" }]}
      />
      <ModuleTabs groupHref="/settings" />
      <ConfigForm
        config={{
          environmentalWeight: config.environmentalWeight,
          socialWeight: config.socialWeight,
          governanceWeight: config.governanceWeight,
          autoEmissionCalculationEnabled: config.autoEmissionCalculationEnabled,
          evidenceRequiredForCsrApproval: config.evidenceRequiredForCsrApproval,
          badgeAutoAwardEnabled: config.badgeAutoAwardEnabled,
          complianceReminderEnabled: config.complianceReminderEnabled,
          policyReminderEnabled: config.policyReminderEnabled,
        }}
        canManage={can(user.role, "esgConfig.manage")}
      />
    </>
  );
}
