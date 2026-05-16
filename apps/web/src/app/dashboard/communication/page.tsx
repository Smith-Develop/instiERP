import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { MessageSquare, Bell, ArrowRight } from "lucide-react";
import Link from "next/link";

const hubs = [
  { title: "Mensajes", description: "Chat interno con otros miembros.", icon: MessageSquare, href: "/dashboard/messages", color: "bg-emerald-50 text-emerald-700" },
  { title: "Notificaciones", description: "Alertas y avisos del sistema.", icon: Bell, href: "/dashboard/notifications", color: "bg-amber-50 text-amber-700" },
  { title: "Calendario", description: "Eventos, exámenes y fechas importantes.", icon: ArrowRight, href: "/dashboard/calendar", color: "bg-purple-50 text-purple-700" },
];

export default async function CommunicationPage() {
  const ctx = await getSessionContext();
  const announcements = await db.announcements.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Comunicación</h2>
          <p className="text-sm text-slate-500">{announcements.length} anuncios</p>
        </div>
        <a href="/dashboard/communication/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nuevo anuncio</a>
      </div>

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-slate-400">No hay anuncios. Crea el primero.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {announcements.map(a => (
            <Card key={a.id}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{a.title}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{a.content}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{a.target}</span>
                  <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString("es-ES", { dateStyle: "long" })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {hubs.map(hub => (
          <Link key={hub.href} href={hub.href}>
            <Card className="h-full hover:border-slate-300 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${hub.color}`}><hub.icon className="h-5 w-5"/></div>
                <CardTitle className="text-base">{hub.title}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-sm text-slate-500">{hub.description}</p></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
