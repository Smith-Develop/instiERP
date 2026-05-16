import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { StudentClassroom } from "@/modules/classroom/student-classroom";

export default async function StudentClassroomPage() {
  const ctx = await getSessionContext();
  const student = await db.students.findFirst({ where: { user_id: ctx.userId, school_id: ctx.schoolId } });
  if (!student) return <p className="text-sm text-slate-400 p-6">Perfil de estudiante no encontrado.</p>;

  const enrollments = await db.enrollments.findMany({
    where: { student_id: student.id, academic_year_id: ctx.academicYearId, deleted_at: null },
    include: { section: { include: { grade: true } } },
  });

  const sectionIds = enrollments.map(e => e.section_id);
  const assignments = await db.classroom_assignments.findMany({
    where: { section_id: { in: sectionIds }, school_id: ctx.schoolId, deleted_at: null, status: "PUBLISHED" },
    include: {
      subject: { select: { name: true } },
      teacher: { select: { first_name: true, last_name: true } },
      submissions: { where: { student_id: student.id }, take: 1 },
    },
    orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
  });

  const sections = enrollments.map(e => ({ id: e.section_id, label: `${e.section.grade.name} ${e.section.name}` }));

  return <StudentClassroom sections={sections} assignments={assignments} />;
}
