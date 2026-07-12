import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { challengeUpdateSchema } from "@/lib/validations/gamification";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.challenge,
    capability: "challenge.manage",
    schema: challengeUpdateSchema,
    entity: "Challenge",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.challenge, capability: "challenge.manage", entity: "Challenge" });
}
