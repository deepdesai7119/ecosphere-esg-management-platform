import { apiOk, handle, requireApiUser } from "@/lib/api";
import { listNotifications, unreadCount } from "@/server/services/notification.service";

export async function GET() {
  return handle(async () => {
    const user = await requireApiUser();
    const [items, unread] = await Promise.all([
      listNotifications(user.id),
      unreadCount(user.id),
    ]);
    return apiOk({ items, unread });
  });
}
