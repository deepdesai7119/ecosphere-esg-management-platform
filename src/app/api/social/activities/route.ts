import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { activityCreateSchema } from "@/lib/validations/social";

export async function GET() {
  return crudList({
    delegate: prisma.csrActivity,
    include: {
      category: { select: { name: true } },
      department: { select: { name: true } },
      _count: { select: { participations: true } },
    },
  });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.csrActivity,
    capability: "csr.manage",
    schema: activityCreateSchema,
    entity: "CsrActivity",
    transform: (d, u) => ({ ...d, createdById: u.id }),
  });
}
