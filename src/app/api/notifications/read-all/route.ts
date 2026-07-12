import { apiOk, handle, requireApiUser } from "@/lib/api";
import { markAllRead } from "@/server/services/notification.service";

export async function POST() {
  return handle(async () => {
    const user = await requireApiUser();
    await markAllRead(user.id);
    return apiOk({ ok: true });
  });
}
