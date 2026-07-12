import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { categoryCreateSchema } from "@/lib/validations/settings";

export async function GET() {
  return crudList({ delegate: prisma.category, orderBy: { createdAt: "desc" } });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.category,
    capability: "category.manage",
    schema: categoryCreateSchema,
    entity: "Category",
  });
}
