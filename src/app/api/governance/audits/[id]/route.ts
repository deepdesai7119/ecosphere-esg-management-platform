import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { auditUpdateSchema } from "@/lib/validations/governance";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.audit,
    capability: "audit.manage",
    schema: auditUpdateSchema,
    entity: "Audit",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.audit, capability: "audit.manage", entity: "Audit" });
}
