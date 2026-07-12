import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { goalCreateSchema } from "@/lib/validations/environmental";

export async function GET() {
  return crudList({
    delegate: prisma.environmentalGoal,
    orderBy: { createdAt: "desc" },
    include: { department: { select: { name: true } } },
  });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.environmentalGoal,
    capability: "goal.manage",
    schema: goalCreateSchema,
    entity: "EnvironmentalGoal",
  });
}
