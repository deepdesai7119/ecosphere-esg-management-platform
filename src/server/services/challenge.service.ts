import { prisma } from "@/lib/db";
import { HttpError, conflict } from "@/lib/api";
import { getEsgConfig } from "./config.service";
import { logActivity } from "./activityLog.service";
import { notify } from "./notification.service";
import { evaluateBadgesForEmployee } from "./badge.service";
import { canTransition } from "@/lib/esg/challengeLifecycle";
import type { ApprovalStatus, ChallengeStatus } from "@prisma/client";

/** Move a challenge along its lifecycle, validating the transition. */
export async function updateChallengeStatus(params: {
  challengeId: string;
  status: ChallengeStatus;
  actorId: string;
  organizationId: string;
}) {
  const challenge = await prisma.challenge.findUnique({ where: { id: params.challengeId } });
  if (!challenge) throw new HttpError(404, "Challenge not found.");
  if (!canTransition(challenge.status, params.status)) {
    throw new HttpError(
      400,
      `Cannot move a challenge from ${challenge.status} to ${params.status}.`,
    );
  }
  const updated = await prisma.challenge.update({
    where: { id: params.challengeId },
    data: { status: params.status },
  });
  await logActivity({
    organizationId: challenge.organizationId,
    userId: params.actorId,
    action: "challenge.status",
    entityType: "Challenge",
    entityId: challenge.id,
    oldData: { status: challenge.status },
    newData: { status: params.status },
  });
  return updated;
}

/** Employee joins an ACTIVE challenge. */
export async function joinChallenge(challengeId: string, employeeId: string) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw new HttpError(404, "Challenge not found.");
  if (challenge.status !== "ACTIVE") {
    throw new HttpError(400, "You can only join active challenges.");
  }
  const existing = await prisma.challengeParticipation.findUnique({
    where: { challengeId_employeeId: { challengeId, employeeId } },
  });
  if (existing) throw conflict("You have already joined this challenge.");

  const participation = await prisma.challengeParticipation.create({
    data: { challengeId, employeeId, approvalStatus: "PENDING" },
  });
  await logActivity({
    organizationId: challenge.organizationId,
    userId: employeeId,
    action: "challenge.join",
    entityType: "ChallengeParticipation",
    entityId: participation.id,
  });
  return participation;
}

/** Employee updates progress / attaches evidence. */
export async function updateChallengeProgress(params: {
  participationId: string;
  employeeId: string;
  progressPercentage?: number;
  proofFileUrl?: string | null;
  proofComment?: string | null;
}) {
  const participation = await prisma.challengeParticipation.findUnique({
    where: { id: params.participationId },
  });
  if (!participation) throw new HttpError(404, "Participation not found.");
  if (participation.employeeId !== params.employeeId) {
    throw new HttpError(403, "You can only update your own participation.");
  }
  return prisma.challengeParticipation.update({
    where: { id: params.participationId },
    data: {
      progressPercentage: params.progressPercentage ?? participation.progressPercentage,
      proofFileUrl: params.proofFileUrl ?? participation.proofFileUrl,
      proofComment: params.proofComment ?? participation.proofComment,
    },
  });
}

/**
 * Approve / reject a challenge submission. Enforces evidence server-side and
 * credits XP exactly once; approval increments the employee's completed count
 * and triggers badge evaluation. When the challenge is linked to an
 * environmental goal, each approval also adds `goalContribution` to the goal's
 * current value (and un-approving reverses it) in the same transaction.
 */
export async function reviewChallengeParticipation(params: {
  participationId: string;
  decision: Extract<ApprovalStatus, "APPROVED" | "REJECTED">;
  actorId: string;
  reviewComment?: string | null;
}) {
  const participation = await prisma.challengeParticipation.findUnique({
    where: { id: params.participationId },
    include: { challenge: true },
  });
  if (!participation) throw new HttpError(404, "Participation not found.");
  const { challenge } = participation;
  const config = await getEsgConfig(challenge.organizationId);

  if (
    params.decision === "APPROVED" &&
    config.evidenceRequiredForCsrApproval &&
    challenge.evidenceRequired &&
    !participation.proofFileUrl
  ) {
    throw new HttpError(400, "Proof is required before this submission can be approved.");
  }

  const wasApproved = participation.approvalStatus === "APPROVED";
  const xp = challenge.xp;
  const goalDelta =
    challenge.goalId && challenge.goalContribution && Number(challenge.goalContribution) > 0
      ? challenge.goalContribution
      : null;

  await prisma.$transaction(async (tx) => {
    if (params.decision === "APPROVED" && !wasApproved) {
      await tx.user.update({
        where: { id: participation.employeeId },
        data: {
          totalXp: { increment: xp },
          availablePoints: { increment: xp },
          completedChallengeCount: { increment: 1 },
        },
      });
      if (goalDelta) {
        await tx.environmentalGoal.update({
          where: { id: challenge.goalId! },
          data: { currentValue: { increment: goalDelta } },
        });
      }
    } else if (params.decision === "REJECTED" && wasApproved) {
      await tx.user.update({
        where: { id: participation.employeeId },
        data: {
          totalXp: { decrement: xp },
          availablePoints: { decrement: xp },
          completedChallengeCount: { decrement: 1 },
        },
      });
      if (goalDelta) {
        await tx.environmentalGoal.update({
          where: { id: challenge.goalId! },
          data: { currentValue: { decrement: goalDelta } },
        });
      }
    }

    await tx.challengeParticipation.update({
      where: { id: params.participationId },
      data: {
        approvalStatus: params.decision,
        reviewedById: params.actorId,
        reviewComment: params.reviewComment ?? null,
        xpAwarded: params.decision === "APPROVED" ? xp : 0,
        progressPercentage: params.decision === "APPROVED" ? 100 : participation.progressPercentage,
        completedAt: params.decision === "APPROVED" ? new Date() : null,
      },
    });

    await logActivity(
      {
        organizationId: challenge.organizationId,
        userId: params.actorId,
        action: `challenge.${params.decision.toLowerCase()}`,
        entityType: "ChallengeParticipation",
        entityId: participation.id,
        newData: { decision: params.decision, xp },
      },
      tx,
    );
  });

  if (params.decision === "APPROVED") {
    await evaluateBadgesForEmployee(participation.employeeId);
  }

  await notify({
    organizationId: challenge.organizationId,
    userId: participation.employeeId,
    type: params.decision === "APPROVED" ? "CHALLENGE_APPROVED" : "CHALLENGE_REJECTED",
    title:
      params.decision === "APPROVED"
        ? `Challenge approved: ${challenge.title}`
        : `Challenge submission rejected: ${challenge.title}`,
    message:
      params.decision === "APPROVED"
        ? `Your submission for "${challenge.title}" was approved. You earned ${xp} XP.`
        : `Your submission for "${challenge.title}" was rejected.${params.reviewComment ? ` Note: ${params.reviewComment}` : ""}`,
    entityType: "ChallengeParticipation",
    entityId: participation.id,
  });

  return prisma.challengeParticipation.findUnique({ where: { id: params.participationId } });
}
