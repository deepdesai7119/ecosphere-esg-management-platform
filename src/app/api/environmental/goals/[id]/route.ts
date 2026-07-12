import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { goalUpdateSchema } from "@/lib/validations/environmental";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.environmentalGoal,
    capability: "goal.manage",
    schema: goalUpdateSchema,
    entity: "EnvironmentalGoal",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.environmentalGoal, capability: "goal.manage", entity: "EnvironmentalGoal" });
}
