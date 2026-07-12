import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { activityUpdateSchema } from "@/lib/validations/social";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.csrActivity,
    capability: "csr.manage",
    schema: activityUpdateSchema,
    entity: "CsrActivity",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.csrActivity, capability: "csr.manage", entity: "CsrActivity" });
}
