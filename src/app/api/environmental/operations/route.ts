import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { crudList } from "@/server/crud";
import { prisma } from "@/lib/db";
import { operationCreateSchema } from "@/lib/validations/environmental";
import { createBusinessOperation } from "@/server/services/emission.service";

export async function GET() {
  return crudList({
    delegate: prisma.businessOperation,
    orderBy: { operationDate: "desc" },
    include: {
      department: { select: { name: true } },
      emissionFactor: { select: { name: true, scope: true } },
      carbonTransaction: { select: { id: true, co2eKg: true } },
    },
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireApiCapability("operation.manage");
    const data = await parseBody(req, operationCreateSchema);
    const result = await createBusinessOperation(
      { organizationId: user.organizationId, ...data },
      user.id,
    );
    return apiOk(result, { status: 201 });
  });
}
