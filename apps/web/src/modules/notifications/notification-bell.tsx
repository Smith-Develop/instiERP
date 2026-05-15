"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type Notif = {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(d => {
      if (d.data) {
        setNotifs(d.data.items.slice(0, 5));
        setUnreadCount(d.data.unreadCount);
      }
    });
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setUnreadCount(0);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-sm text-slate-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#2563EB] hover:underline">Marcar todas leídas</button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">Sin notificaciones</p>
              ) : (
                notifs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { if (n.link) router.push(n.link); setOpen(false); }}
                    className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                  >
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString("es-ES")}</p>
                  </button>
                ))
              )}
            </div>
            <div className="border-t px-4 py-2">
              <button onClick={() => { router.push("/dashboard/notifications"); setOpen(false); }} className="w-full text-center text-xs text-[#2563EB] hover:underline py-1">
                Ver todas las notificaciones
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
