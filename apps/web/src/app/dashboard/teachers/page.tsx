import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { TeacherTable } from "@/modules/teachers/table";
import { NewTeacherButton } from "@/modules/teachers/new-teacher-button";

export default async function TeachersPage() {
  const ctx = await getSessionContext();

  const teachers = await db.teachers.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: {
      teacher_assignments: {
        where: { deleted_at: null },
        include: { subject: true, grade: true, section: true },
      },
    },
    orderBy: { last_name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Profesores</h2>
          <p className="text-sm text-slate-500">{teachers.length} registrados</p>
        </div>
        <NewTeacherButton />
      </div>

      <TeacherTable teachers={teachers} />
    </div>
  );
}
