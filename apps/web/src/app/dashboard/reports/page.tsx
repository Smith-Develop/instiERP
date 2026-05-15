import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { ReportsView } from "@/modules/reports/reports-view";

export default async function ReportsPage() {
  const ctx = await getSessionContext();

  const sections = await db.sections.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { grade: true },
    orderBy: [{ grade: { sort_order: "asc" } }, { sort_order: "asc" }],
  });

  // Get the first section's data for the preview
  const firstSection = sections[0];
  let students: { id: string; name: string; average: number; items: { name: string; score: number | null }[] }[] = [];

  if (firstSection) {
    const enrollments = await db.enrollments.findMany({
      where: { section_id: firstSection.id, academic_year_id: ctx.academicYearId, deleted_at: null },
      include: { student: { select: { id: true, first_name: true, last_name: true } } },
    });

    if (enrollments.length > 0) {
      const gradeItems = await db.grade_items.findMany({ where: { grade_id: firstSection.grade_id, deleted_at: null } });
      const studentGrades = await db.student_grades.findMany({
        where: { student_id: { in: enrollments.map(e => e.student_id) }, grade_item_id: { in: gradeItems.map(gi => gi.id) }, deleted_at: null },
      });

      students = enrollments.map(enr => {
        const grades = gradeItems.map(gi => {
          const sg = studentGrades.find(g => g.student_id === enr.student_id && g.grade_item_id === gi.id);
          return { name: gi.name, score: sg?.score ? Number(sg.score) : null };
        });
        const validScores = grades.filter(g => g.score !== null);
        const average = validScores.length > 0 ? validScores.reduce((sum, g) => sum + (g.score ?? 0), 0) / validScores.length : 0;
        return { id: enr.student.id, name: `${enr.student.last_name}, ${enr.student.first_name}`, average: Math.round(average * 100) / 100, items: grades };
      });
      students.sort((a, b) => b.average - a.average);
    }
  }

  return <ReportsView sections={sections.map(s => ({ id: s.id, label: `${s.grade.name} ${s.name}` }))} firstSection={firstSection?.id ?? null} students={students} />;
}
