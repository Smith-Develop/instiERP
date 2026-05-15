"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@insti/ui";
import { CheckCheck, Bell, Info, AlertTriangle, Megaphone } from "lucide-react";

type Notif = { id: string; title: string; content: string; type: string; isRead: boolean; link: string | null; createdAt: string };

const typeIcons: Record<string, React.ElementType> = {
  INFO: Info,
  WARNING: AlertTriangle,
  ANNOUNCEMENT: Megaphone,
};

export function NotificationList({ items }: { items: Notif[] }) {
  const router = useRouter();
  const [notifs, setNotifs] = useState(items);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    router.refresh();
  }

  if (notifs.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-4"><Bell className="h-8 w-8 text-slate-400"/></div>
      <h3 className="text-lg font-semibold text-slate-900">Sin notificaciones</h3>
      <p className="text-sm text-slate-500">No tienes notificaciones pendientes.</p>
    </div>
  );

  const unreadCount = notifs.filter(n => !n.isRead).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1"><CheckCheck className="h-4 w-4"/> Marcar todas leídas</Button>
        </div>
      )}
      <div className="space-y-2">
        {notifs.map(n => {
          const Icon = typeIcons[n.type] ?? Bell;
          return (
            <button
              key={n.id}
              onClick={() => { if (n.link) router.push(n.link); }}
              className={`w-full text-left flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                n.isRead ? "border-slate-200 bg-white hover:border-slate-300" : "border-blue-200 bg-blue-50/50"
              }`}
            >
              <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${n.isRead ? "bg-slate-100" : "bg-blue-100"}`}>
                <Icon className={`h-4 w-4 ${n.isRead ? "text-slate-400" : "text-blue-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{n.content}</p>
                <p className="text-xs text-slate-400 mt-1.5">{new Date(n.createdAt).toLocaleDateString("es-ES", { dateStyle: "long" })}</p>
              </div>
              {!n.isRead && <span className="shrink-0 mt-2 h-2 w-2 rounded-full bg-blue-500"/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
