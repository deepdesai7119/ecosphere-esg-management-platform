import { apiOk, badRequest, handle, parseBody, requireApiCapability, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getEsgConfig } from "@/server/services/config.service";
import { validateWeights } from "@/lib/esg/scoring";
import { esgConfigSchema } from "@/lib/validations/settings";
import { logActivity } from "@/server/services/activityLog.service";

export async function GET() {
  return handle(async () => {
    const user = await requireApiUser();
    const config = await getEsgConfig(user.organizationId);
    return apiOk(config);
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireApiCapability("esgConfig.manage");
    const body = await parseBody(req, esgConfigSchema);
    const current = await getEsgConfig(user.organizationId);

    const environmental = body.environmentalWeight ?? current.environmentalWeight;
    const social = body.socialWeight ?? current.socialWeight;
    const governance = body.governanceWeight ?? current.governanceWeight;

    const weightsTouched =
      body.environmentalWeight !== undefined ||
      body.socialWeight !== undefined ||
      body.governanceWeight !== undefined;

    if (weightsTouched) {
      const { valid, total } = validateWeights({ environmental, social, governance });
      if (!valid) throw badRequest(`ESG weights must sum to exactly 100 (got ${total}).`);
    }

    const updated = await prisma.esgConfiguration.update({
      where: { organizationId: user.organizationId },
      data: { ...body, environmentalWeight: environmental, socialWeight: social, governanceWeight: governance },
    });

    if (weightsTouched) {
      await prisma.organization.update({
        where: { id: user.organizationId },
        data: { environmentalWeight: environmental, socialWeight: social, governanceWeight: governance },
      });
    }

    await logActivity({
      organizationId: user.organizationId,
      userId: user.id,
      action: "config.update",
      entityType: "EsgConfiguration",
      entityId: updated.id,
    });

    return apiOk(updated);
  });
}
