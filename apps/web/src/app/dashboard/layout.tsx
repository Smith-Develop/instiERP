import Link from "next/link";
import { Avatar, AvatarFallback } from "@insti/ui";
import { Separator } from "@insti/ui";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  FileText,
  MessageSquare,
  Banknote,
  Calendar,
  Settings,
  Building2,
  UserPlus,
  LogOut,
  UserRound,
  Library,
  AlertTriangle,
} from "lucide-react";
import { getServerSession } from "@/lib/session";
import { NotificationBell } from "@/modules/notifications/notification-bell";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Panel" },
  { href: "/dashboard/students", icon: Users, label: "Estudiantes" },
  { href: "/dashboard/teachers", icon: GraduationCap, label: "Profesores" },
  { href: "/dashboard/guardians", icon: UserRound, label: "Tutores" },
  { href: "/dashboard/admissions", icon: UserPlus, label: "Admisiones" },
  { href: "/dashboard/subjects", icon: Library, label: "Asignaturas" },
  { href: "/dashboard/academic", icon: Building2, label: "Académico" },
  { href: "/dashboard/attendance", icon: ClipboardCheck, label: "Asistencia" },
  { href: "/dashboard/grades", icon: BookOpen, label: "Calificaciones" },
  { href: "/dashboard/behavior", icon: AlertTriangle, label: "Conducta" },
  { href: "/dashboard/messages", icon: MessageSquare, label: "Mensajes" },
  { href: "/dashboard/reports", icon: FileText, label: "Boletines" },
  { href: "/dashboard/communication", icon: MessageSquare, label: "Mensajes" },
  { href: "/dashboard/finance", icon: Banknote, label: "Finanzas" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendario" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const initials = session?.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col bg-[#1E3A5F] text-white">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-sm font-bold">
            I
          </div>
          <span className="text-lg font-semibold">Insti ERP</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-[#2D5A8A] hover:text-white"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <Separator className="bg-white/10" />

        {/* User footer */}
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-white/15 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user.name ?? "Invitado"}
              </p>
              <p className="text-xs text-white/60 truncate">
                {session?.user.email ?? ""}
              </p>
            </div>
            <a
              href="/api/auth/sign-out"
              className="rounded-md p-1 text-white/50 hover:text-white hover:bg-white/10"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-6">
          <div className="flex-1">
            <h1 className="text-sm font-medium text-slate-900">
              {session?.user.name
                ? `Bienvenido, ${session.user.name.split(" ")[0]}`
                : "Panel de control"}
            </h1>
          </div>
          <NotificationBell />
          <Link
            href="/dashboard/settings"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
