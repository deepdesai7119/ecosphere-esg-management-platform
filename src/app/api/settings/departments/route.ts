import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { departmentCreateSchema } from "@/lib/validations/settings";

export async function GET() {
  return crudList({
    delegate: prisma.department,
    orderBy: { name: "asc" },
    include: {
      head: { select: { name: true } },
      parent: { select: { name: true } },
      _count: { select: { members: true } },
    },
  });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.department,
    capability: "department.manage",
    schema: departmentCreateSchema,
    entity: "Department",
  });
}
