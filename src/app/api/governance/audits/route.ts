import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { auditCreateSchema } from "@/lib/validations/governance";

export async function GET() {
  return crudList({
    delegate: prisma.audit,
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { name: true } },
      auditor: { select: { name: true } },
      _count: { select: { issues: true } },
    },
  });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.audit,
    capability: "audit.manage",
    schema: auditCreateSchema,
    entity: "Audit",
  });
}
