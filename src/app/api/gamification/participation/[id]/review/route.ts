import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { reviewSchema } from "@/lib/validations/gamification";
import { reviewChallengeParticipation } from "@/server/services/challenge.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("challenge.approve");
    const { id } = await params;
    const body = await parseBody(req, reviewSchema);
    const result = await reviewChallengeParticipation({
      participationId: id,
      actorId: user.id,
      ...body,
    });
    return apiOk(result);
  });
}
