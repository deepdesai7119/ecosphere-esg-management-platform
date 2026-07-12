import { prisma } from "@/lib/db";
import { crudDelete } from "@/server/crud";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({
    id,
    delegate: prisma.businessOperation,
    capability: "operation.manage",
    entity: "BusinessOperation",
  });
}
