import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { crudList } from "@/server/crud";
import { prisma } from "@/lib/db";
import { policyCreateSchema } from "@/lib/validations/governance";
import { publishPolicyAcknowledgements } from "@/server/services/policy.service";

export async function GET() {
  return crudList({
    delegate: prisma.esgPolicy,
    orderBy: { createdAt: "desc" },
    include: { department: { select: { name: true } } },
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireApiCapability("policy.manage");
    const data = await parseBody(req, policyCreateSchema);

    const policy = await prisma.esgPolicy.create({
      data: {
        organizationId: user.organizationId,
        createdById: user.id,
        title: data.title,
        code: data.code,
        version: data.version,
        description: data.description ?? null,
        departmentId: data.departmentId ?? null,
        effectiveDate: data.effectiveDate ?? null,
        acknowledgementDueDate: data.acknowledgementDueDate ?? null,
        acknowledgementRequired: data.acknowledgementRequired,
        status: data.status,
      },
    });

    // Publishing a policy that requires acknowledgement fans out ack requests.
    if (policy.status === "PUBLISHED" && policy.acknowledgementRequired) {
      await publishPolicyAcknowledgements(policy.id, user.organizationId);
    }

    return apiOk(policy, { status: 201 });
  });
}
