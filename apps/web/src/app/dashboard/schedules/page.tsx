import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { SchedulesView } from "@/modules/schedules/schedules-view";

export default async function SchedulesPage() {
  const ctx = await getSessionContext();

  const [teachers, subjects, sections, teacherAssignments] = await Promise.all([
    db.teachers.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, select: { id: true, first_name: true, last_name: true } }),
    db.subjects.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, select: { id: true, name: true } }),
    db.sections.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, include: { grade: true } }),
    db.teacher_assignments.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, select: { teacher_id: true, subject_id: true, section_id: true } }),
  ]);

  return <SchedulesView teachers={teachers} subjects={subjects} sections={sections} teacherAssignments={teacherAssignments} />;
}
