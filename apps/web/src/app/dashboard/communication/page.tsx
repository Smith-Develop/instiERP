import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Megaphone, MessageSquare, Bell, ArrowRight } from "lucide-react";
import Link from "next/link";

const hubs = [
  {
    title: "Anuncios",
    description: "Publica comunicados para profesores, padres y estudiantes.",
    icon: Megaphone,
    href: "/dashboard/communication",
    color: "bg-blue-50 text-blue-700",
  },
  {
    title: "Mensajes",
    description: "Chat interno con otros miembros del colegio.",
    icon: MessageSquare,
    href: "/dashboard/messages",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Notificaciones",
    description: "Alertas y avisos del sistema.",
    icon: Bell,
    href: "/dashboard/notifications",
    color: "bg-amber-50 text-amber-700",
  },
  {
    title: "Calendario",
    description: "Eventos, exámenes y fechas importantes.",
    icon: ArrowRight,
    href: "/dashboard/calendar",
    color: "bg-purple-50 text-purple-700",
  },
];

export default function CommunicationHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Comunicación</h2>
        <p className="text-sm text-slate-500">Gestiona la comunicación del colegio</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {hubs.map((hub) => (
          <Link key={hub.href} href={hub.href}>
            <Card className="h-full hover:border-slate-300 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${hub.color}`}>
                  <hub.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{hub.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{hub.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
