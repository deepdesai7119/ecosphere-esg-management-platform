import { prisma } from "@/lib/db";
import { notify } from "./notification.service";
import { evaluateBadgesForEmployee } from "./badge.service";

/**
 * Fan out acknowledgement requests for a newly-published policy: create a
 * PENDING PolicyAcknowledgement for every ACTIVE user in the organisation
 * (skipping any that already exist via the `@@unique([policyId, employeeId])`
 * constraint) and notify each of them.
 */
export async function publishPolicyAcknowledgements(
  policyId: string,
  organizationId: string,
): Promise<{ created: number }> {
  const policy = await prisma.esgPolicy.findUnique({
    where: { id: policyId },
    select: { id: true, title: true },
  });
  if (!policy) return { created: 0 };

  const users = await prisma.user.findMany({
    where: { organizationId, status: "ACTIVE" },
    select: { id: true },
  });
  if (users.length === 0) return { created: 0 };

  // createMany + skipDuplicates avoids racing/duplicate acknowledgements.
  const result = await prisma.policyAcknowledgement.createMany({
    data: users.map((u) => ({
      policyId,
      employeeId: u.id,
      acknowledgementStatus: "PENDING" as const,
    })),
    skipDuplicates: true,
  });

  await Promise.all(
    users.map((u) =>
      notify({
        organizationId,
        userId: u.id,
        type: "POLICY_PUBLISHED",
        title: `New policy published: ${policy.title}`,
        message: `The policy "${policy.title}" requires your acknowledgement.`,
        entityType: "EsgPolicy",
        entityId: policy.id,
      }),
    ),
  );

  return { created: result.count };
}

/**
 * Record an employee's acknowledgement of a policy. Idempotent — upserts the
 * acknowledgement to ACKNOWLEDGED and re-evaluates gamification badges (the
 * POLICY_ACKNOWLEDGEMENTS unlock metric).
 */
export async function acknowledgePolicy(policyId: string, employeeId: string) {
  const ack = await prisma.policyAcknowledgement.upsert({
    where: { policyId_employeeId: { policyId, employeeId } },
    create: {
      policyId,
      employeeId,
      acknowledgementStatus: "ACKNOWLEDGED",
      acknowledgedAt: new Date(),
    },
    update: {
      acknowledgementStatus: "ACKNOWLEDGED",
      acknowledgedAt: new Date(),
    },
  });

  await evaluateBadgesForEmployee(employeeId);

  return ack;
}
