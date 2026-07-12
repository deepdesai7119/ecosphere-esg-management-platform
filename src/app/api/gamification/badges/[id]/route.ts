import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { badgeUpdateSchema } from "@/lib/validations/gamification";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.badge,
    capability: "badge.manage",
    schema: badgeUpdateSchema,
    entity: "Badge",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.badge, capability: "badge.manage", entity: "Badge" });
}
