import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { SubjectTable } from "@/modules/subjects/table";
import { NewSubjectButton } from "@/modules/subjects/new-subject-button";

export default async function SubjectsPage() {
  const ctx = await getSessionContext();
  const subjects = await db.subjects.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Asignaturas</h2><p className="text-sm text-slate-500">{subjects.length} asignaturas</p></div>
        <NewSubjectButton />
      </div>
      <SubjectTable subjects={subjects} />
    </div>
  );
}
