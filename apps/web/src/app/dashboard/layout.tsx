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
import { SidebarWrapper } from "@/modules/layout/sidebar-wrapper";
import { hasPermission, PERMISSIONS, type Role } from "@insti/auth";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  permission: string;
}

const allNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Panel", permission: PERMISSIONS.STUDENTS_READ },
  { href: "/dashboard/students", icon: Users, label: "Estudiantes", permission: PERMISSIONS.STUDENTS_READ },
  { href: "/dashboard/teachers", icon: GraduationCap, label: "Profesores", permission: PERMISSIONS.TEACHERS_READ },
  { href: "/dashboard/guardians", icon: UserRound, label: "Tutores", permission: PERMISSIONS.GUARDIANS_READ },
  { href: "/dashboard/admissions", icon: UserPlus, label: "Admisiones", permission: PERMISSIONS.ADMISSIONS_READ },
  { href: "/dashboard/subjects", icon: Library, label: "Asignaturas", permission: PERMISSIONS.SUBJECTS_READ },
  { href: "/dashboard/academic", icon: Building2, label: "Académico", permission: PERMISSIONS.SETTINGS_READ },
  { href: "/dashboard/attendance", icon: ClipboardCheck, label: "Asistencia", permission: PERMISSIONS.ATTENDANCE_READ },
  { href: "/dashboard/grades", icon: BookOpen, label: "Calificaciones", permission: PERMISSIONS.GRADES_READ },
  { href: "/dashboard/behavior", icon: AlertTriangle, label: "Conducta", permission: PERMISSIONS.BEHAVIOR_READ },
  { href: "/dashboard/messages", icon: MessageSquare, label: "Mensajes", permission: PERMISSIONS.COMMUNICATION_READ },
  { href: "/dashboard/reports", icon: FileText, label: "Boletines", permission: PERMISSIONS.REPORTS_READ },
  { href: "/dashboard/communication", icon: MessageSquare, label: "Comunicación", permission: PERMISSIONS.COMMUNICATION_READ },
  { href: "/dashboard/finance", icon: Banknote, label: "Finanzas", permission: PERMISSIONS.FINANCE_READ },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendario", permission: PERMISSIONS.SCHEDULE_READ },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const role = (session?.user.role ?? "SUPER_ADMIN") as Role;

  const navItems = allNavItems.filter((item) =>
    hasPermission(role, item.permission),
  );

  const initials = session?.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  const sidebar = (
    <>
      <div className="flex h-14 items-center gap-3 px-4 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-sm font-bold">I</div>
        <span className="text-lg font-semibold">Insti ERP</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-[#2D5A8A] hover:text-white">
            <item.icon className="h-5 w-5" />{item.label}
          </Link>
        ))}
      </nav>
      <Separator className="bg-white/10" />
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar className="h-8 w-8"><AvatarFallback className="bg-white/15 text-white text-xs">{initials}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{session?.user.name ?? "Invitado"}</p><p className="text-xs text-white/60 truncate">{session?.user.email ?? ""} · {role}</p></div>
          <a href="/api/auth/sign-out" className="rounded-md p-1 text-white/50 hover:text-white hover:bg-white/10" title="Cerrar sesión"><LogOut className="h-4 w-4"/></a>
        </div>
      </div>
    </>
  );

  const headerContent = (
    <>
      <div className="flex-1">
        <h1 className="text-sm font-medium text-slate-900">
          {session?.user.name ? `Bienvenido, ${session.user.name.split(" ")[0]}` : "Panel de control"}
        </h1>
      </div>
      <NotificationBell />
      <Link href="/dashboard/settings" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Settings className="h-5 w-5"/></Link>
    </>
  );

  return (
    <SidebarWrapper sidebar={sidebar} headerContent={headerContent}>
      <div className="p-4 lg:p-6">{children}</div>
    </SidebarWrapper>
  );
}
