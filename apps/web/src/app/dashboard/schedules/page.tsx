import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { SchedulesView } from "@/modules/schedules/schedules-view";

export default async function SchedulesPage() {
  const ctx = await getSessionContext();

  const [schedules, teachers, subjects, sections] = await Promise.all([
    db.schedules.findMany({
      where: { school_id: ctx.schoolId, academic_year_id: ctx.academicYearId, deleted_at: null },
      include: { teacher: { select: { first_name: true, last_name: true } }, subject: { select: { name: true } }, grade: { select: { name: true } }, section: { select: { name: true } } },
      orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
    }),
    db.teachers.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, select: { id: true, first_name: true, last_name: true } }),
    db.subjects.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, select: { id: true, name: true } }),
    db.sections.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, include: { grade: true } }),
  ]);

  return <SchedulesView schedules={schedules} teachers={teachers} subjects={subjects} sections={sections} />;
}
