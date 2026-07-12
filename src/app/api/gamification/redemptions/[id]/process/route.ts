import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { processSchema } from "@/lib/validations/gamification";
import { processRedemption } from "@/server/services/reward.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("redemption.process");
    const { id } = await params;
    const { status } = await parseBody(req, processSchema);
    const updated = await processRedemption({ redemptionId: id, status, actorId: user.id });
    return apiOk(updated);
  });
}
