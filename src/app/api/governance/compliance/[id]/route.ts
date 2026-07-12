import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { crudDelete } from "@/server/crud";
import { prisma } from "@/lib/db";
import { complianceUpdateSchema } from "@/lib/validations/governance";
import { updateComplianceIssue } from "@/server/services/compliance.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("compliance.manage");
    const { id } = await params;
    const body = await parseBody(req, complianceUpdateSchema);
    const updated = await updateComplianceIssue({ id, actorId: user.id, ...body });
    return apiOk(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return crudDelete({ id, delegate: prisma.complianceIssue, capability: "compliance.manage", entity: "ComplianceIssue" });
}
