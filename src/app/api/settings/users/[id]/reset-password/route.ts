import { apiOk, handle, requireApiCapability } from "@/lib/api";
import { DEMO_PASSWORD } from "@/lib/constants";
import { resetUserPassword } from "@/server/services/user.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireApiCapability("user.manage");
    const { id } = await params;
    await resetUserPassword(id);
    return apiOk({ ok: true, tempPassword: DEMO_PASSWORD });
  });
}
