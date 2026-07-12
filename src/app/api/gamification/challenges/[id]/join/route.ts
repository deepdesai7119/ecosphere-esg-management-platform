import { apiOk, handle, requireApiCapability } from "@/lib/api";
import { joinChallenge } from "@/server/services/challenge.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("challenge.join");
    const { id } = await params;
    const participation = await joinChallenge(id, user.id);
    return apiOk(participation, { status: 201 });
  });
}
