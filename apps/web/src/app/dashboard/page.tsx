import { getSessionContext } from "@/lib/context";
import type { Role } from "@insti/auth";
import { db } from "@insti/database";
import { DirectorDashboard } from "@/modules/dashboard/director-dashboard";
import { SecretariaDashboard } from "@/modules/dashboard/secretaria-dashboard";
import { ProfesorDashboard } from "@/modules/dashboard/profesor-dashboard";
import { PadreDashboard } from "@/modules/dashboard/padre-dashboard";
import { EstudianteDashboard } from "@/modules/dashboard/estudiante-dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Users, GraduationCap, ClipboardCheck, FileText } from "lucide-react";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const role = ctx.role as Role;

  // Render the role-specific dashboard
  switch (role) {
    case "DIRECTOR":
      return <DirectorDashboard schoolId={ctx.schoolId} academicYearId={ctx.academicYearId} />;
    case "SECRETARIA":
      return <SecretariaDashboard schoolId={ctx.schoolId} academicYearId={ctx.academicYearId} />;
    case "PROFESOR":
      return <ProfesorDashboard schoolId={ctx.schoolId} academicYearId={ctx.academicYearId} userId={ctx.userId} />;
    case "PADRE":
      return <PadreDashboard schoolId={ctx.schoolId} academicYearId={ctx.academicYearId} userId={ctx.userId} />;
    case "ESTUDIANTE":
      return <EstudianteDashboard schoolId={ctx.schoolId} academicYearId={ctx.academicYearId} userId={ctx.userId} />;
    default: {
      // SUPER_ADMIN or CONTABILIDAD — generic admin dashboard
      const [studentCount, teacherCount, enrollmentCount, levelsWithGrades, recentStudents] = await Promise.all([
        db.students.count({ where: { school_id: ctx.schoolId, deleted_at: null } }),
        db.teachers.count({ where: { school_id: ctx.schoolId, deleted_at: null } }),
        db.enrollments.count({ where: { school_id: ctx.schoolId, academic_year_id: ctx.academicYearId, deleted_at: null } }),
        db.academic_levels.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, include: { _count: { select: { grades: true } } } }),
        db.students.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, orderBy: { created_at: "desc" }, take: 5, include: { enrollments: { where: { academic_year_id: ctx.academicYearId, deleted_at: null }, include: { grade: true, section: true } } } }),
      ]);

      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Panel de control</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Estudiantes", value: studentCount, icon: Users },
              { label: "Profesores", value: teacherCount, icon: GraduationCap },
              { label: "Matrículas", value: enrollmentCount, icon: ClipboardCheck },
              { label: "Niveles", value: levelsWithGrades.length, icon: FileText },
            ].map(kpi => (
              <Card key={kpi.label}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-500">{kpi.label}</CardTitle><kpi.icon className="h-4 w-4 text-slate-400"/></CardHeader><CardContent><div className="text-2xl font-bold text-slate-900">{kpi.value}</div></CardContent></Card>
            ))}
          </div>
          <Card><CardHeader><CardTitle>Últimos estudiantes</CardTitle></CardHeader><CardContent><table className="w-full"><thead><tr className="border-b"><th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Estudiante</th><th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Curso</th></tr></thead><tbody>{recentStudents.map(s => { const e = s.enrollments[0]; return <tr key={s.id} className="border-b last:border-0"><td className="py-3 text-sm font-medium">{s.last_name}, {s.first_name}</td><td className="py-3 text-sm text-slate-500">{e ? `${e.grade.name} ${e.section.name}` : "—"}</td></tr>; })}</tbody></table></CardContent></Card>
        </div>
      );
    }
  }
}
