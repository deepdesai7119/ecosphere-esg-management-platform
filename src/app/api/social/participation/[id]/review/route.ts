import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { reviewSchema } from "@/lib/validations/social";
import { reviewCsrParticipation } from "@/server/services/csr.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("csr.approve");
    const { id } = await params;
    const body = await parseBody(req, reviewSchema);
    const result = await reviewCsrParticipation({
      participationId: id,
      actorId: user.id,
      ...body,
    });
    return apiOk(result);
  });
}
