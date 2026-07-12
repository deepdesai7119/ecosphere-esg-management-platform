import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { trainingCreateSchema } from "@/lib/validations/social";

export async function GET() {
  return crudList({
    delegate: prisma.training,
    include: {
      department: { select: { name: true } },
      _count: { select: { completions: true } },
    },
  });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.training,
    capability: "training.manage",
    schema: trainingCreateSchema,
    entity: "Training",
  });
}
