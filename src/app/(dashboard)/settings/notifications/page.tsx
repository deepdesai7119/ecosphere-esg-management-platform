import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { getEsgConfig } from "@/server/services/config.service";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { NotificationsClient } from "./notifications-client";

export const metadata = { title: "Notification Settings" };
export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage() {
  const user = await requireUser();
  const [config, pref] = await Promise.all([
    getEsgConfig(user.organizationId),
    prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Notification Settings"
        description="Control organisation-wide channels and your personal preferences."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Notifications" }]}
      />
      <ModuleTabs groupHref="/settings" />
      <NotificationsClient
        org={{
          emailNotificationsEnabled: config.emailNotificationsEnabled,
          inAppNotificationsEnabled: config.inAppNotificationsEnabled,
        }}
        prefs={{
          complianceIssueNotifications: pref.complianceIssueNotifications,
          participationDecisionNotifications: pref.participationDecisionNotifications,
          policyReminderNotifications: pref.policyReminderNotifications,
          badgeUnlockNotifications: pref.badgeUnlockNotifications,
          emailEnabled: pref.emailEnabled,
          inAppEnabled: pref.inAppEnabled,
        }}
        canManageOrg={can(user.role, "esgConfig.manage")}
      />
    </>
  );
}
