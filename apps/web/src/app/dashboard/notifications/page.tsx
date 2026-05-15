import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { NotificationList } from "@/modules/notifications/notification-list";

export default async function NotificationsPage() {
  const ctx = await getSessionContext();

  const notifs = await db.notifications.findMany({
    where: { user_id: ctx.userId },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Notificaciones</h2><p className="text-sm text-slate-500">{notifs.filter(n => !n.is_read).length} sin leer</p></div>
      <NotificationList
        items={notifs.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          type: n.type,
          isRead: n.is_read,
          link: n.link,
          createdAt: n.created_at.toISOString(),
        }))}
      />
    </div>
  );
}
