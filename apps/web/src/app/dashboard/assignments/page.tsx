import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { AssignmentsView } from "@/modules/assignments/assignments-view";

export default async function AssignmentsPage() {
  const ctx = await getSessionContext();

  const [assignments, teachers, subjects, sections] = await Promise.all([
    db.teacher_assignments.findMany({
      where: { school_id: ctx.schoolId, deleted_at: null },
      include: { teacher: { select: { first_name: true, last_name: true } }, subject: true, grade: true, section: true },
      orderBy: { created_at: "desc" },
    }),
    db.teachers.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, select: { id: true, first_name: true, last_name: true }, orderBy: { last_name: "asc" } }),
    db.subjects.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.sections.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, include: { grade: true }, orderBy: [{ grade: { sort_order: "asc" } }, { sort_order: "asc" }] }),
  ]);

  return <AssignmentsView assignments={assignments} teachers={teachers} subjects={subjects} sections={sections} />;
}
