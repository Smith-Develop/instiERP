import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { TeacherTable } from "@/modules/teachers/table";

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
        <a
          href="/dashboard/teachers/new"
          className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]"
        >
          + Nuevo profesor
        </a>
      </div>

      <TeacherTable teachers={teachers} />
    </div>
  );
}
