import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { redeemSchema } from "@/lib/validations/gamification";
import { redeemReward } from "@/server/services/reward.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("reward.redeem");
    const { id } = await params;
    const { quantity } = await parseBody(req, redeemSchema);
    const redemption = await redeemReward({ rewardId: id, employeeId: user.id, quantity });
    return apiOk(redemption, { status: 201 });
  });
}
