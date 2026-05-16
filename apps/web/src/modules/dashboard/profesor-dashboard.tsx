import { db } from "@insti/database";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { ClipboardCheck, BookOpen, Clock, Users } from "lucide-react";
import Link from "next/link";

interface Props { schoolId: string; academicYearId: string; userId: string }

export async function ProfesorDashboard({ schoolId, academicYearId, userId }: Props) {
  const teacher = await db.teachers.findFirst({ where: { user_id: userId, school_id: schoolId, deleted_at: null } });
  if (!teacher) return <p className="text-sm text-slate-400">No se encontró perfil de profesor.</p>;

  const assignments = await db.teacher_assignments.findMany({
    where: { teacher_id: teacher.id, school_id: schoolId, deleted_at: null },
    include: { subject: true, grade: true, section: true },
  });

  // Sections this teacher is assigned to
  const sectionIds = [...new Set(assignments.filter(a => a.section_id).map(a => a.section_id!))];

  // Today's schedule
  const today = new Date(); const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const schedule = await db.schedules.findMany({
    where: { teacher_id: teacher.id, school_id: schoolId, deleted_at: null },
    include: { subject: true, grade: true, section: true },
    orderBy: { start_time: "asc" },
  });
  const todaySchedule = schedule.filter(s => s.day_of_week === dayOfWeek);

  // Students in assigned sections
  const sectionStudents = await db.enrollments.findMany({
    where: { section_id: { in: sectionIds }, academic_year_id: academicYearId, deleted_at: null, is_active: true },
    include: { student: { select: { first_name: true, last_name: true } }, section: true },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Panel del Profesor</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Secciones asignadas", value: sectionIds.length, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Asignaturas", value: assignments.length, icon: BookOpen, color: "text-emerald-600 bg-emerald-50" },
          { label: "Alumnos a cargo", value: sectionStudents.length, icon: ClipboardCheck, color: "text-purple-600 bg-purple-50" },
          { label: "Clases hoy", value: todaySchedule.length, icon: Clock, color: "text-amber-600 bg-amber-50" },
        ].map(kpi => (
          <Card key={kpi.label}><CardContent className="pt-6"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}><kpi.icon className="h-5 w-5"/></div><div><p className="text-2xl font-bold text-slate-900">{kpi.value}</p><p className="text-xs text-slate-500">{kpi.label}</p></div></div></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Horario de hoy</CardTitle></CardHeader><CardContent>{todaySchedule.length > 0 ? <div className="space-y-2">{todaySchedule.map(s => <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2"><div><p className="text-sm font-medium">{s.subject.name}</p><p className="text-xs text-slate-500">{s.grade.name}{s.section ? ` ${s.section.name}` : ""}</p></div><span className="text-sm text-slate-500">{s.start_time} - {s.end_time}</span></div>)}</div> : <p className="text-sm text-slate-400">Sin clases programadas hoy.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Acceso rápido</CardTitle></CardHeader><CardContent className="space-y-2">{assignments.slice(0, 4).map(a => <Link key={a.id} href={`/dashboard/attendance`} className="block rounded-md border px-3 py-2 hover:border-slate-300 transition-colors"><p className="text-sm font-medium text-slate-900">{a.subject.name}</p><p className="text-xs text-slate-500">{a.grade.name}{a.section ? ` ${a.section.name}` : ""} · Pasar lista</p></Link>)}</CardContent></Card>
      </div>
    </div>
  );
}
