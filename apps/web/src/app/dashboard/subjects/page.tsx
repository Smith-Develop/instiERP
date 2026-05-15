import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { SubjectTable } from "@/modules/subjects/table";

export default async function SubjectsPage() {
  const ctx = await getSessionContext();
  const subjects = await db.subjects.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Asignaturas</h2><p className="text-sm text-slate-500">{subjects.length} asignaturas</p></div>
        <a href="/dashboard/subjects/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nueva asignatura</a>
      </div>
      <SubjectTable subjects={subjects} />
    </div>
  );
}
