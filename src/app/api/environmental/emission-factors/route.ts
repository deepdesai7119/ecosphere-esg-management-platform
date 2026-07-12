import { prisma } from "@/lib/db";
import { crudCreate, crudList } from "@/server/crud";
import { factorCreateSchema } from "@/lib/validations/environmental";

export async function GET() {
  return crudList({ delegate: prisma.emissionFactor, orderBy: { createdAt: "desc" } });
}

export async function POST(req: Request) {
  return crudCreate({
    req,
    delegate: prisma.emissionFactor,
    capability: "factor.manage",
    schema: factorCreateSchema,
    entity: "EmissionFactor",
  });
}
