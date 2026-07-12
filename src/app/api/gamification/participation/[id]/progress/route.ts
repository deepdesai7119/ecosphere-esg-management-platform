import { apiOk, handle, parseBody, requireApiUser } from "@/lib/api";
import { progressSchema } from "@/lib/validations/gamification";
import { updateChallengeProgress } from "@/server/services/challenge.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    const body = await parseBody(req, progressSchema);
    const updated = await updateChallengeProgress({
      participationId: id,
      employeeId: user.id,
      ...body,
    });
    return apiOk(updated);
  });
}
