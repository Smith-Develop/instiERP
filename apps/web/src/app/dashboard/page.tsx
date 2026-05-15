import { db } from "@insti/database";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Users, GraduationCap, ClipboardCheck, FileText, Library } from "lucide-react";
import { getSessionContext } from "@/lib/context";

export default async function DashboardPage() {
  const ctx = await getSessionContext();

  const [studentCount, teacherCount, enrollmentCount, levelsWithGrades] =
    await Promise.all([
      db.students.count({ where: { school_id: ctx.schoolId, deleted_at: null } }),
      db.teachers.count({ where: { school_id: ctx.schoolId, deleted_at: null } }),
      db.enrollments.count({
        where: { school_id: ctx.schoolId, academic_year_id: ctx.academicYearId, deleted_at: null },
      }),
      db.academic_levels.findMany({
        where: { school_id: ctx.schoolId, deleted_at: null },
        include: { _count: { select: { grades: true } } },
      }),
    ]);

  const kpis = [
    { label: "Estudiantes activos", value: studentCount, icon: Users },
    { label: "Profesores", value: teacherCount, icon: GraduationCap },
    { label: "Matrículas 2026-27", value: enrollmentCount, icon: ClipboardCheck },
    { label: "Niveles académicos", value: levelsWithGrades.length, icon: FileText },
    { label: "Grados", value: levelsWithGrades.reduce((sum, l) => sum + l._count.grades, 0), icon: Library },
  ];

  const recentStudents = await db.students.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { created_at: "desc" },
    take: 5,
    include: {
      enrollments: {
        where: { academic_year_id: ctx.academicYearId, deleted_at: null },
        include: { grade: true, section: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Panel de control</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{kpi.label}</CardTitle>
              <kpi.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos estudiantes registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Estudiante</th>
                <th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Documento</th>
                <th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Curso</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((student) => {
                const enrollment = student.enrollments[0];
                return (
                  <tr key={student.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-slate-900">
                      {student.last_name}, {student.first_name}
                    </td>
                    <td className="py-3 text-sm text-slate-500">{student.document_number ?? "—"}</td>
                    <td className="py-3 text-sm">
                      {enrollment ? `${enrollment.grade.name} ${enrollment.section.name}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
