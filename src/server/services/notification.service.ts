import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/notifications/email";
import { getEsgConfig } from "./config.service";
import type { Notification, NotificationType } from "@prisma/client";

export interface NotifyInput {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

// Map a notification type to the per-user preference toggle that gates it.
const PREF_KEY: Partial<Record<NotificationType, string>> = {
  COMPLIANCE_ASSIGNED: "complianceIssueNotifications",
  COMPLIANCE_OVERDUE: "complianceIssueNotifications",
  CSR_APPROVED: "participationDecisionNotifications",
  CSR_REJECTED: "participationDecisionNotifications",
  CHALLENGE_APPROVED: "participationDecisionNotifications",
  CHALLENGE_REJECTED: "participationDecisionNotifications",
  POLICY_REMINDER: "policyReminderNotifications",
  BADGE_UNLOCKED: "badgeUnlockNotifications",
};

/**
 * Central notification entry point. Honours organisation-level config and
 * per-user preferences. In-app notifications persist to the DB; email is sent
 * only when both org config and user preference allow it (and is best-effort).
 */
export async function notify(input: NotifyInput): Promise<Notification | null> {
  const [config, pref] = await Promise.all([
    getEsgConfig(input.organizationId),
    prisma.notificationPreference.findUnique({ where: { userId: input.userId } }),
  ]);

  // Respect a specific per-type preference toggle when present.
  const prefKey = PREF_KEY[input.type];
  if (prefKey && pref && (pref as unknown as Record<string, boolean>)[prefKey] === false) {
    return null;
  }

  const inAppEnabled = pref ? pref.inAppEnabled : config.inAppNotificationsEnabled;

  let notification: Notification | null = null;
  if (inAppEnabled !== false) {
    notification = await prisma.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
  }

  const emailEnabled =
    config.emailNotificationsEnabled && (pref ? pref.emailEnabled : false);
  if (emailEnabled) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });
    if (user?.email) {
      const result = await sendEmail({
        to: user.email,
        subject: input.title,
        text: input.message,
      });
      if (result.delivered && notification) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { emailSentAt: new Date() },
        });
      }
    }
  }

  return notification;
}

/** Notify every ESG_MANAGER and ORG_ADMIN in the organisation. */
export async function notifyManagers(
  organizationId: string,
  input: Omit<NotifyInput, "userId" | "organizationId">,
): Promise<void> {
  const managers = await prisma.user.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      role: { in: ["ESG_MANAGER", "ORG_ADMIN"] },
    },
    select: { id: true },
  });
  await Promise.all(
    managers.map((m) => notify({ ...input, organizationId, userId: m.id })),
  );
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
