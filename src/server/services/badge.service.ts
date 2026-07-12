import { prisma } from "@/lib/db";
import { getEsgConfig } from "./config.service";
import { notify } from "./notification.service";
import type { Badge, UnlockMetric } from "@prisma/client";

async function metricValue(
  employeeId: string,
  metric: UnlockMetric,
  cached: { totalXp: number; completedChallengeCount: number },
): Promise<number> {
  switch (metric) {
    case "TOTAL_XP":
      return cached.totalXp;
    case "COMPLETED_CHALLENGES":
      return cached.completedChallengeCount;
    case "CSR_PARTICIPATIONS":
      return prisma.csrParticipation.count({
        where: { employeeId, approvalStatus: "APPROVED" },
      });
    case "POLICY_ACKNOWLEDGEMENTS":
      return prisma.policyAcknowledgement.count({
        where: { employeeId, acknowledgementStatus: "ACKNOWLEDGED" },
      });
    default:
      return 0;
  }
}

/**
 * Evaluate all active badge rules for an employee and award any newly-earned
 * badges. A badge is never awarded twice — both by an explicit ownership check
 * and by the `@@unique([employeeId, badgeId])` DB constraint.
 *
 * @param force  bypass the org's badgeAutoAwardEnabled flag (manual award).
 */
export async function evaluateBadgesForEmployee(
  employeeId: string,
  options: { force?: boolean } = {},
): Promise<Badge[]> {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      organizationId: true,
      totalXp: true,
      completedChallengeCount: true,
    },
  });
  if (!employee) return [];

  const config = await getEsgConfig(employee.organizationId);
  if (!config.badgeAutoAwardEnabled && !options.force) return [];

  const [badges, owned] = await Promise.all([
    prisma.badge.findMany({
      where: { organizationId: employee.organizationId, status: "ACTIVE" },
    }),
    prisma.employeeBadge.findMany({
      where: { employeeId },
      select: { badgeId: true },
    }),
  ]);
  const ownedIds = new Set(owned.map((o) => o.badgeId));

  const awarded: Badge[] = [];
  for (const badge of badges) {
    if (ownedIds.has(badge.id)) continue;
    const value = await metricValue(employeeId, badge.unlockMetric, employee);
    if (value < badge.unlockThreshold) continue;

    try {
      await prisma.employeeBadge.create({
        data: {
          employeeId,
          badgeId: badge.id,
          awardReason: `Reached ${badge.unlockThreshold} ${badge.unlockMetric.toLowerCase().replace(/_/g, " ")}`,
        },
      });
      awarded.push(badge);
      await notify({
        organizationId: employee.organizationId,
        userId: employeeId,
        type: "BADGE_UNLOCKED",
        title: `Badge unlocked: ${badge.name}`,
        message: `You earned the "${badge.name}" badge. ${badge.description ?? ""}`.trim(),
        entityType: "Badge",
        entityId: badge.id,
      });
    } catch {
      // Unique constraint hit (already awarded in a race) — ignore.
    }
  }

  return awarded;
}
