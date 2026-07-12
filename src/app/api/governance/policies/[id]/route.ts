import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { policyUpdateSchema } from "@/lib/validations/governance";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.esgPolicy,
    capability: "policy.manage",
    schema: policyUpdateSchema,
    entity: "EsgPolicy",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.esgPolicy, capability: "policy.manage", entity: "EsgPolicy" });
}
