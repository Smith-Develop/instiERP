import { db } from "@insti/database";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Users, GraduationCap, ClipboardCheck, Library, CheckCircle, AlertTriangle } from "lucide-react";

interface Props { schoolId: string; academicYearId: string }

export async function DirectorDashboard({ schoolId, academicYearId }: Props) {
  const [studentCount, teacherCount, enrollmentCount, levelsWithGrades, activeAcademicYear] = await Promise.all([
    db.students.count({ where: { school_id: schoolId, deleted_at: null } }),
    db.teachers.count({ where: { school_id: schoolId, deleted_at: null } }),
    db.enrollments.count({ where: { school_id: schoolId, academic_year_id: academicYearId, deleted_at: null } }),
    db.academic_levels.findMany({ where: { school_id: schoolId, deleted_at: null }, include: { _count: { select: { grades: true } } } }),
    db.academic_years.findFirst({ where: { school_id: schoolId, is_active: true } }),
  ]);

  // Attendance stats: today's attendance across all sections
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayAttendance = await db.attendances.findMany({
    where: { school_id: schoolId, date: { gte: today, lt: tomorrow }, deleted_at: null },
  });
  const presentCount = todayAttendance.filter(a => a.status === "PRESENTE").length;
  const absentCount = todayAttendance.filter(a => a.status === "AUSENTE").length;
  const totalAttendance = todayAttendance.length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  // Recent enrollments
  const recentEnrollments = await db.enrollments.findMany({
    where: { school_id: schoolId, academic_year_id: academicYearId, deleted_at: null },
    orderBy: { created_at: "desc" },
    take: 5,
    include: { student: { select: { first_name: true, last_name: true } }, grade: true, section: true },
  });

  const pendingInvoices = await db.invoices.count({ where: { school_id: schoolId, status: "PENDIENTE", deleted_at: null } });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Panel del Director</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Estudiantes activos", value: studentCount, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Profesores", value: teacherCount, icon: GraduationCap, color: "text-emerald-600 bg-emerald-50" },
          { label: "Matrículas " + (activeAcademicYear?.year_label ?? ""), value: enrollmentCount, icon: ClipboardCheck, color: "text-purple-600 bg-purple-50" },
          { label: "Niveles académicos", value: levelsWithGrades.length, icon: Library, color: "text-amber-600 bg-amber-50" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}><kpi.icon className="h-5 w-5"/></div>
                <div><p className="text-2xl font-bold text-slate-900">{kpi.value}</p><p className="text-xs text-slate-500">{kpi.label}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Asistencia hoy</CardTitle></CardHeader>
          <CardContent>
            {totalAttendance > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Tasa de asistencia</span><span className="text-xl font-bold text-emerald-600">{attendanceRate}%</span></div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{width: `${attendanceRate}%`}}/></div>
                <div className="flex gap-4 text-sm"><span className="text-emerald-600"><CheckCircle className="inline h-4 w-4"/> {presentCount} presentes</span><span className="text-red-500"><AlertTriangle className="inline h-4 w-4"/> {absentCount} ausentes</span></div>
              </div>
            ) : <p className="text-sm text-slate-400">Sin registros de asistencia hoy.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Matrículas recientes</CardTitle></CardHeader>
          <CardContent>
            {recentEnrollments.length > 0 ? (
              <div className="space-y-2">
                {recentEnrollments.map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"><span className="text-sm font-medium">{e.student.last_name}, {e.student.first_name}</span><span className="text-xs text-slate-500">{e.grade.name} {e.section.name}</span></div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">Sin matrículas recientes.</p>}
          </CardContent>
        </Card>
      </div>

      {pendingInvoices > 0 && (
        <Card><CardContent className="pt-6 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-500"/><p className="text-sm text-slate-700">{pendingInvoices} facturas pendientes de pago.</p></CardContent></Card>
      )}
    </div>
  );
}
