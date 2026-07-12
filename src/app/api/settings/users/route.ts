import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { crudList } from "@/server/crud";
import { prisma } from "@/lib/db";
import { userCreateSchema } from "@/lib/validations/settings";
import { createUser } from "@/server/services/user.service";

export async function GET() {
  return crudList({
    delegate: prisma.user,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      totalXp: true,
      departmentId: true,
      department: { select: { name: true } },
    },
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireApiCapability("user.manage");
    const body = await parseBody(req, userCreateSchema);
    const created = await createUser({ organizationId: user.organizationId, ...body });
    return apiOk(created, { status: 201 });
  });
}
