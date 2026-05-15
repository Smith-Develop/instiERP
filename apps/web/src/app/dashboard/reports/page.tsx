import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";

export default async function ReportsPage() {
  const ctx = await getSessionContext();

  const sections = await db.sections.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { grade: true },
    orderBy: [{ grade: { sort_order: "asc" } }, { sort_order: "asc" }],
  });

  // Get the first section's students with grades
  const firstSection = sections[0];
  let students: { id: string; name: string; average: number; items: { name: string; score: number | null }[] }[] = [];

  if (firstSection) {
    const enrollments = await db.enrollments.findMany({
      where: { section_id: firstSection.id, academic_year_id: ctx.academicYearId, deleted_at: null },
      include: { student: { select: { id: true, first_name: true, last_name: true } } },
    });

    if (enrollments.length > 0) {
      const gradeItems = await db.grade_items.findMany({
        where: { grade_id: firstSection.grade_id, deleted_at: null },
      });

      const studentGrades = await db.student_grades.findMany({
        where: {
          student_id: { in: enrollments.map(e => e.student_id) },
          grade_item_id: { in: gradeItems.map(gi => gi.id) },
          deleted_at: null,
        },
      });

      students = enrollments.map(enr => {
        const grades = gradeItems.map(gi => {
          const sg = studentGrades.find(g => g.student_id === enr.student_id && g.grade_item_id === gi.id);
          return { name: gi.name, score: sg?.score ? Number(sg.score) : null };
        });

        const validScores = grades.filter(g => g.score !== null);
        const average = validScores.length > 0
          ? validScores.reduce((sum, g) => sum + (g.score ?? 0), 0) / validScores.length
          : 0;

        return {
          id: enr.student.id,
          name: `${enr.student.last_name}, ${enr.student.first_name}`,
          average: Math.round(average * 100) / 100,
          items: grades,
        };
      });

      students.sort((a, b) => b.average - a.average);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Boletines</h2>
        <p className="text-sm text-slate-500">Resumen de calificaciones por sección</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <span key={s.id} className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
            {s.grade.name} {s.name}
          </span>
        ))}
      </div>

      {firstSection && students.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b bg-slate-50 px-6 py-3">
            <h3 className="font-semibold text-slate-900">Boletín — {firstSection.grade.name} {firstSection.name}</h3>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left text-xs font-medium uppercase text-slate-500">Estudiante</th>
                  {students[0]?.items.map(it => (
                    <th key={it.name} className="py-3 text-center text-xs font-medium uppercase text-slate-500">{it.name}</th>
                  ))}
                  <th className="py-3 text-center text-xs font-medium uppercase text-slate-500">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => (
                  <tr key={st.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900 text-sm">{st.name}</td>
                    {st.items.map(it => (
                      <td key={it.name} className="py-3 text-center text-sm">
                        {it.score !== null ? (
                          <span className={it.score >= 5 ? "text-slate-700" : "text-red-600"}>{it.score}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="py-3 text-center">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                        st.average >= 5 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {st.average.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-slate-400">
          Registra notas en la sección de Calificaciones para ver los boletines.
        </div>
      )}
    </div>
  );
}
