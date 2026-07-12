import { prisma } from "@/lib/db";
import { HttpError, conflict } from "@/lib/api";
import { getEsgConfig } from "./config.service";
import { logActivity } from "./activityLog.service";
import { notify } from "./notification.service";
import { evaluateBadgesForEmployee } from "./badge.service";
import type { ApprovalStatus } from "@prisma/client";

/** Employee joins a CSR activity (creates a PENDING participation). */
export async function joinCsrActivity(activityId: string, employeeId: string) {
  const activity = await prisma.csrActivity.findUnique({
    where: { id: activityId },
    include: { _count: { select: { participations: true } } },
  });
  if (!activity) throw new HttpError(404, "Activity not found.");
  if (activity.status !== "ACTIVE") throw new HttpError(400, "This activity is not open.");

  if (
    activity.registrationDeadline &&
    activity.registrationDeadline.getTime() < Date.now()
  ) {
    throw new HttpError(400, "Registration for this activity has closed.");
  }
  if (activity.capacity && activity._count.participations >= activity.capacity) {
    throw conflict("This activity is already at capacity.");
  }

  const existing = await prisma.csrParticipation.findUnique({
    where: { activityId_employeeId: { activityId, employeeId } },
  });
  if (existing) throw conflict("You have already joined this activity.");

  const participation = await prisma.csrParticipation.create({
    data: { activityId, employeeId, approvalStatus: "PENDING" },
  });

  await logActivity({
    organizationId: activity.organizationId,
    userId: employeeId,
    action: "csr.join",
    entityType: "CsrParticipation",
    entityId: participation.id,
  });
  return participation;
}

/** Employee attaches / updates proof for their participation. */
export async function submitCsrProof(params: {
  participationId: string;
  employeeId: string;
  proofFileUrl?: string | null;
  proofComment?: string | null;
}) {
  const participation = await prisma.csrParticipation.findUnique({
    where: { id: params.participationId },
  });
  if (!participation) throw new HttpError(404, "Participation not found.");
  if (participation.employeeId !== params.employeeId) {
    throw new HttpError(403, "You can only update your own participation.");
  }
  return prisma.csrParticipation.update({
    where: { id: params.participationId },
    data: {
      proofFileUrl: params.proofFileUrl ?? participation.proofFileUrl,
      proofComment: params.proofComment ?? participation.proofComment,
    },
  });
}

/**
 * Approve or reject a CSR participation. Enforces the evidence rule on the
 * backend and credits points exactly once (idempotent across re-reviews).
 */
export async function reviewCsrParticipation(params: {
  participationId: string;
  decision: Extract<ApprovalStatus, "APPROVED" | "REJECTED">;
  actorId: string;
  reviewComment?: string | null;
}) {
  const participation = await prisma.csrParticipation.findUnique({
    where: { id: params.participationId },
    include: { activity: true },
  });
  if (!participation) throw new HttpError(404, "Participation not found.");
  const { activity } = participation;
  const config = await getEsgConfig(activity.organizationId);

  // Evidence business rule — enforced server-side.
  if (
    params.decision === "APPROVED" &&
    config.evidenceRequiredForCsrApproval &&
    activity.evidenceRequired &&
    !participation.proofFileUrl
  ) {
    throw new HttpError(400, "Proof is required before this participation can be approved.");
  }

  const wasApproved = participation.approvalStatus === "APPROVED";
  const points = activity.points;

  await prisma.$transaction(async (tx) => {
    if (params.decision === "APPROVED" && !wasApproved) {
      await tx.user.update({
        where: { id: participation.employeeId },
        data: {
          availablePoints: { increment: points },
          totalXp: { increment: points },
        },
      });
    } else if (params.decision === "REJECTED" && wasApproved) {
      await tx.user.update({
        where: { id: participation.employeeId },
        data: {
          availablePoints: { decrement: points },
          totalXp: { decrement: points },
        },
      });
    }

    await tx.csrParticipation.update({
      where: { id: params.participationId },
      data: {
        approvalStatus: params.decision,
        reviewedById: params.actorId,
        reviewComment: params.reviewComment ?? null,
        pointsEarned: params.decision === "APPROVED" ? points : 0,
        completionDate: params.decision === "APPROVED" ? new Date() : null,
      },
    });

    await logActivity(
      {
        organizationId: activity.organizationId,
        userId: params.actorId,
        action: `csr.${params.decision.toLowerCase()}`,
        entityType: "CsrParticipation",
        entityId: participation.id,
        newData: { decision: params.decision, points },
      },
      tx,
    );
  });

  if (params.decision === "APPROVED") {
    await evaluateBadgesForEmployee(participation.employeeId);
  }

  await notify({
    organizationId: activity.organizationId,
    userId: participation.employeeId,
    type: params.decision === "APPROVED" ? "CSR_APPROVED" : "CSR_REJECTED",
    title:
      params.decision === "APPROVED"
        ? `CSR participation approved: ${activity.title}`
        : `CSR participation rejected: ${activity.title}`,
    message:
      params.decision === "APPROVED"
        ? `Your participation in "${activity.title}" was approved. You earned ${points} points.`
        : `Your participation in "${activity.title}" was rejected.${params.reviewComment ? ` Note: ${params.reviewComment}` : ""}`,
    entityType: "CsrParticipation",
    entityId: participation.id,
  });

  return prisma.csrParticipation.findUnique({ where: { id: params.participationId } });
}
