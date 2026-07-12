import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { productUpdateSchema } from "@/lib/validations/environmental";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.productEsgProfile,
    capability: "product.manage",
    schema: productUpdateSchema,
    entity: "ProductEsgProfile",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.productEsgProfile, capability: "product.manage", entity: "ProductEsgProfile" });
}
