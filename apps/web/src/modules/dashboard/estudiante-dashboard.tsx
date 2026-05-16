import { db } from "@insti/database";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { BookOpen, ClipboardCheck, Calendar, TrendingUp } from "lucide-react";

interface Props { schoolId: string; academicYearId: string; userId: string }

export async function EstudianteDashboard({ schoolId, academicYearId, userId }: Props) {
  const student = await db.students.findFirst({ where: { user_id: userId, school_id: schoolId, deleted_at: null } });
  if (!student) return <p className="text-sm text-slate-400">No se encontró perfil de estudiante.</p>;

  const enrollment = await db.enrollments.findFirst({
    where: { student_id: student.id, academic_year_id: academicYearId, deleted_at: null },
    include: { grade: true, section: true },
  });

  // Recent grades
  const recentGrades = await db.student_grades.findMany({
    where: { student_id: student.id, deleted_at: null },
    include: { grade_item: true },
    orderBy: { updated_at: "desc" },
    take: 8,
  });

  // Recent attendance
  const recentAttendance = await db.attendances.findMany({
    where: { student_id: student.id, deleted_at: null },
    orderBy: { date: "desc" },
    take: 10,
  });

  const attendanceStats = { present: recentAttendance.filter(a => a.status === "PRESENTE").length, absent: recentAttendance.filter(a => a.status === "AUSENTE").length, tardy: recentAttendance.filter(a => a.status === "TARDANZA").length, total: recentAttendance.length };

  // Upcoming events
  const upcomingEvents = await db.events.findMany({
    where: { school_id: schoolId, deleted_at: null, start_date: { gte: new Date() } },
    orderBy: { start_date: "asc" },
    take: 3,
  });

  // Average
  const allScores = recentGrades.filter(g => g.score != null).map(g => Number(g.score));
  const avg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Mi Panel</h2>
      <p className="text-sm text-slate-500">{student.first_name} {student.last_name}{enrollment ? ` · ${enrollment.grade.name} ${enrollment.section.name}` : ""}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Promedio general", value: avg, icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "Asistencia", value: attendanceStats.total > 0 ? `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` : "—", icon: ClipboardCheck, color: "text-emerald-600 bg-emerald-50" },
          { label: "Eventos próximos", value: upcomingEvents.length, icon: Calendar, color: "text-amber-600 bg-amber-50" },
          { label: "Notas recientes", value: recentGrades.length, icon: BookOpen, color: "text-purple-600 bg-purple-50" },
        ].map(kpi => (
          <Card key={kpi.label}><CardContent className="pt-6"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}><kpi.icon className="h-5 w-5"/></div><div><p className="text-2xl font-bold text-slate-900">{String(kpi.value)}</p><p className="text-xs text-slate-500">{kpi.label}</p></div></div></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Últimas notas</CardTitle></CardHeader><CardContent>{recentGrades.length > 0 ? <div className="space-y-2">{recentGrades.map(g => <div key={g.id} className="flex items-center justify-between rounded-md border px-3 py-2"><span className="text-sm text-slate-600">{g.grade_item.name}</span><span className={`text-sm font-medium ${g.score && Number(g.score) >= 5 ? "text-emerald-600" : "text-red-600"}`}>{g.score ? Number(g.score).toFixed(1) : "—"}</span></div>)}</div> : <p className="text-sm text-slate-400">Sin notas registradas.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Próximos eventos</CardTitle></CardHeader><CardContent>{upcomingEvents.length > 0 ? <div className="space-y-2">{upcomingEvents.map(e => <div key={e.id} className="rounded-md border px-3 py-2"><p className="text-sm font-medium">{e.title}</p><p className="text-xs text-slate-500">{new Date(e.start_date).toLocaleDateString("es-ES", { dateStyle: "long" })}</p></div>)}</div> : <p className="text-sm text-slate-400">Sin eventos próximos.</p>}</CardContent></Card>
      </div>
    </div>
  );
}
