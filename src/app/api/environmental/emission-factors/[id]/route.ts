import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { factorUpdateSchema } from "@/lib/validations/environmental";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.emissionFactor,
    capability: "factor.manage",
    schema: factorUpdateSchema,
    entity: "EmissionFactor",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.emissionFactor, capability: "factor.manage", entity: "EmissionFactor" });
}
