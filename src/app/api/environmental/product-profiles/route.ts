import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { productCreateSchema } from "@/lib/validations/environmental";

export async function GET() {
  return crudList({ delegate: prisma.productEsgProfile, orderBy: { createdAt: "desc" } });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.productEsgProfile,
    capability: "product.manage",
    schema: productCreateSchema,
    entity: "ProductEsgProfile",
  });
}
