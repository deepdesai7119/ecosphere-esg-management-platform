import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { challengeCreateSchema } from "@/lib/validations/gamification";

export async function GET() {
  return crudList({
    delegate: prisma.challenge,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { participations: true } },
    },
  });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.challenge,
    capability: "challenge.manage",
    schema: challengeCreateSchema,
    entity: "Challenge",
    transform: (d, u) => ({ ...d, createdById: u.id }),
  });
}
