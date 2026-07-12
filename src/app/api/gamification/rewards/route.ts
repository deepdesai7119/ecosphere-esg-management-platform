import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { rewardCreateSchema } from "@/lib/validations/gamification";

export async function GET() {
  return crudList({
    delegate: prisma.reward,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.reward,
    capability: "reward.manage",
    schema: rewardCreateSchema,
    entity: "Reward",
  });
}
