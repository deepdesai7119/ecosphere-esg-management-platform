import { prisma } from "@/lib/db";
import { crudDelete, crudUpdate } from "@/server/crud";
import { departmentUpdateSchema } from "@/lib/validations/settings";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudUpdate({
    req,
    id,
    delegate: prisma.department,
    capability: "department.manage",
    schema: departmentUpdateSchema,
    entity: "Department",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.department, capability: "department.manage", entity: "Department" });
}
