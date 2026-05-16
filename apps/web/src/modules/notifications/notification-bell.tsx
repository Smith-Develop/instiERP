"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type Notif = { id: string; title: string; content: string; type: string; isRead: boolean; link: string | null; createdAt: string };

async function fetchNotifications() {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Error");
  return res.json() as Promise<{ data: { items: Notif[]; unreadCount: number } }>;
}

async function markAllRead() {
  await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30000, // poll every 30s
  });

  const markMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifs = data?.data?.items?.slice(0, 5) ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
        <Bell className="h-5 w-5"/>
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-sm text-slate-900">Notificaciones</h3>
              {unreadCount > 0 && <button onClick={() => markMutation.mutate()} className="text-xs text-[#2563EB] hover:underline">Marcar todas leídas</button>}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">Sin notificaciones</p>
              : notifs.map(n => (
                <button key={n.id} onClick={() => { if (n.link) router.push(n.link); setOpen(false); }} className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-slate-50 ${!n.isRead ? "bg-blue-50/50" : ""}`}>
                  <p className="text-sm font-medium text-slate-900">{n.title}</p><p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.content}</p><p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString("es-ES")}</p>
                </button>
              ))}
            </div>
            <div className="border-t px-4 py-2"><button onClick={() => { router.push("/dashboard/notifications"); setOpen(false); }} className="w-full text-center text-xs text-[#2563EB] hover:underline py-1">Ver todas</button></div>
          </div>
        </>
      )}
    </div>
  );
}
