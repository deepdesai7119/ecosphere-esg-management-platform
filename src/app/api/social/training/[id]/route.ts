import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { trainingUpdateSchema } from "@/lib/validations/social";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.training,
    capability: "training.manage",
    schema: trainingUpdateSchema,
    entity: "Training",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.training, capability: "training.manage", entity: "Training" });
}
