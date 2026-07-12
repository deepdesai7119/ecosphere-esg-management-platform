import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { categoryUpdateSchema } from "@/lib/validations/settings";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.category,
    capability: "category.manage",
    schema: categoryUpdateSchema,
    entity: "Category",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.category, capability: "category.manage", entity: "Category" });
}
