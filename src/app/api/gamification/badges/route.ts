import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { badgeCreateSchema } from "@/lib/validations/gamification";

export async function GET() {
  return crudList({
    delegate: prisma.badge,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { employeeBadges: true } } },
  });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.badge,
    capability: "badge.manage",
    schema: badgeCreateSchema,
    entity: "Badge",
  });
}
