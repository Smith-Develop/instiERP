import { db } from "@insti/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export default async function StudentHistoryPage({ params }: PageProps) {
  const { studentId } = await params;

  const student = await db.students.findUnique({
    where: { id: studentId, deleted_at: null },
  });
  if (!student) notFound();

  // Get all enrollments across years
  const enrollments = await db.enrollments.findMany({
    where: { student_id: studentId, deleted_at: null },
    include: { grade: true, section: true, academic_year: true },
    orderBy: { academic_year: { start_date: "desc" } },
  });

  // Get all grades for this student grouped by academic year
  const allGrades = await db.student_grades.findMany({
    where: { student_id: studentId, deleted_at: null },
    include: { grade_item: { include: { subject: true } } },
  });

  // Group grades by academic_year_id
  const gradesByYear = new Map<string, typeof allGrades>();
  for (const g of allGrades) {
    const list = gradesByYear.get(g.academic_year_id) ?? [];
    list.push(g);
    gradesByYear.set(g.academic_year_id, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/reports" className="rounded-md p-1 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Historial académico</h2>
          <p className="text-sm text-slate-500">{student.last_name}, {student.first_name}</p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">Sin historial académico registrado.</div>
      ) : (
        <div className="space-y-6">
          {enrollments.map((enr) => {
            const yearGrades = gradesByYear.get(enr.academic_year_id) ?? [];
            // Group by subject
            const bySubject = new Map<string, typeof yearGrades>();
            for (const g of yearGrades) {
              const subj = g.grade_item.subject?.name ?? "Sin asignatura";
              const list = bySubject.get(subj) ?? [];
              list.push(g);
              bySubject.set(subj, list);
            }

            const allScores = yearGrades.filter(g => g.score != null).map(g => Number(g.score));
            const yearAvg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2) : "—";

            return (
              <div key={enr.id} className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b bg-slate-50 px-6 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{enr.academic_year.year_label}</h3>
                    <p className="text-sm text-slate-500">{enr.grade.name} {enr.section.name}</p>
                  </div>
                  <span className="inline-flex rounded-md bg-[#1E3A5F]/10 px-3 py-1 text-sm font-medium text-[#1E3A5F]">
                    Promedio: {yearAvg}
                  </span>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[...bySubject.entries()].map(([subject, grades]) => (
                      <div key={subject}>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">{subject}</h4>
                        <div className="flex flex-wrap gap-2">
                          {grades.map(g => (
                            <span key={g.id} className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm">
                              <span className="text-slate-500 mr-2">{g.grade_item.name}:</span>
                              <span className="font-medium">{g.score != null ? Number(g.score).toFixed(1) : "—"}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {bySubject.size === 0 && <p className="text-sm text-slate-400">Sin calificaciones registradas este año.</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
