import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { challengeStatusSchema } from "@/lib/validations/gamification";
import { updateChallengeStatus } from "@/server/services/challenge.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("challenge.manage");
    const { id } = await params;
    const { status } = await parseBody(req, challengeStatusSchema);
    const updated = await updateChallengeStatus({
      challengeId: id,
      status,
      actorId: user.id,
      organizationId: user.organizationId,
    });
    return apiOk(updated);
  });
}
