import { prisma } from "@/lib/db";
import { HttpError, conflict } from "@/lib/api";
import { logActivity } from "./activityLog.service";
import { notify } from "./notification.service";
import { humanizeEnum } from "@/lib/format";
import type { RedemptionStatus } from "@prisma/client";

/**
 * Redeem a reward for an employee. Runs entirely inside one Prisma transaction:
 * validates points and stock, then deducts both using conditional `updateMany`
 * guards so two concurrent requests can never over-spend points or oversell
 * stock (the second update matches zero rows and rolls back).
 */
export async function redeemReward(params: {
  rewardId: string;
  employeeId: string;
  quantity?: number;
}) {
  const quantity = params.quantity ?? 1;
  if (quantity < 1) throw new HttpError(400, "Quantity must be at least 1.");

  const redemption = await prisma.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({ where: { id: params.rewardId } });
    if (!reward) throw new HttpError(404, "Reward not found.");
    if (reward.status !== "ACTIVE") throw new HttpError(400, "Reward is not available.");

    const employee = await tx.user.findUnique({
      where: { id: params.employeeId },
      select: { availablePoints: true, organizationId: true },
    });
    if (!employee) throw new HttpError(404, "Employee not found.");

    const cost = reward.pointsRequired * quantity;
    if (reward.stock < quantity) throw conflict("This reward is out of stock.");
    if (employee.availablePoints < cost) {
      throw conflict("You do not have enough points for this reward.");
    }

    // Guarded deductions — prevent double redemption under concurrency.
    const pointsUpdate = await tx.user.updateMany({
      where: { id: params.employeeId, availablePoints: { gte: cost } },
      data: { availablePoints: { decrement: cost } },
    });
    if (pointsUpdate.count === 0) throw conflict("You do not have enough points.");

    const stockUpdate = await tx.reward.updateMany({
      where: { id: params.rewardId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (stockUpdate.count === 0) throw conflict("This reward is out of stock.");

    const created = await tx.rewardRedemption.create({
      data: {
        rewardId: params.rewardId,
        employeeId: params.employeeId,
        pointsUsed: cost,
        quantity,
        status: "PENDING",
      },
      include: { reward: true },
    });

    await logActivity(
      {
        organizationId: employee.organizationId,
        userId: params.employeeId,
        action: "reward.redeem",
        entityType: "RewardRedemption",
        entityId: created.id,
        newData: { rewardId: params.rewardId, pointsUsed: cost, quantity },
      },
      tx,
    );

    return created;
  });

  await notify({
    organizationId: redemption.reward.organizationId,
    userId: params.employeeId,
    type: "REWARD_STATUS",
    title: `Reward requested: ${redemption.reward.name}`,
    message: `You redeemed ${redemption.pointsUsed} points for "${redemption.reward.name}". Status: Pending.`,
    entityType: "RewardRedemption",
    entityId: redemption.id,
  });

  return redemption;
}

/**
 * Process a redemption (approve / fulfil / reject). Rejecting refunds the
 * employee's points and restocks the reward inside a transaction.
 */
export async function processRedemption(params: {
  redemptionId: string;
  status: RedemptionStatus;
  actorId: string;
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const redemption = await tx.rewardRedemption.findUnique({
      where: { id: params.redemptionId },
      include: { reward: true },
    });
    if (!redemption) throw new HttpError(404, "Redemption not found.");

    if (params.status === "REJECTED" && redemption.status !== "REJECTED") {
      // Refund points and restock.
      await tx.user.update({
        where: { id: redemption.employeeId },
        data: { availablePoints: { increment: redemption.pointsUsed } },
      });
      await tx.reward.update({
        where: { id: redemption.rewardId },
        data: { stock: { increment: redemption.quantity } },
      });
    }

    const result = await tx.rewardRedemption.update({
      where: { id: params.redemptionId },
      data: {
        status: params.status,
        processedAt: new Date(),
        processedById: params.actorId,
      },
      include: { reward: true },
    });

    await logActivity(
      {
        organizationId: redemption.reward.organizationId,
        userId: params.actorId,
        action: "reward.process",
        entityType: "RewardRedemption",
        entityId: redemption.id,
        oldData: { status: redemption.status },
        newData: { status: params.status },
      },
      tx,
    );

    return result;
  });

  await notify({
    organizationId: updated.reward.organizationId,
    userId: updated.employeeId,
    type: "REWARD_STATUS",
    title: `Reward ${humanizeEnum(updated.status).toLowerCase()}: ${updated.reward.name}`,
    message: `Your redemption of "${updated.reward.name}" is now ${humanizeEnum(updated.status)}.`,
    entityType: "RewardRedemption",
    entityId: updated.id,
  });

  return updated;
}
