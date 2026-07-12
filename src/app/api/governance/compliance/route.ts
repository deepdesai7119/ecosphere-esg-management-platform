import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { crudList } from "@/server/crud";
import { prisma } from "@/lib/db";
import { complianceCreateSchema } from "@/lib/validations/governance";
import { createComplianceIssue } from "@/server/services/compliance.service";

export async function GET() {
  return crudList({
    delegate: prisma.complianceIssue,
    orderBy: { dueDate: "asc" },
    include: {
      audit: { select: { title: true } },
      department: { select: { name: true } },
      owner: { select: { name: true } },
    },
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireApiCapability("compliance.manage");
    const body = await parseBody(req, complianceCreateSchema);
    const issue = await createComplianceIssue(
      { organizationId: user.organizationId, ...body },
      user.id,
    );
    return apiOk(issue, { status: 201 });
  });
}
