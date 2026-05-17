import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { AdmissionTable } from "@/modules/admissions/table";
import { NewAdmissionButton } from "@/modules/admissions/new-admission-button";

export default async function AdmissionsPage() {
  const ctx = await getSessionContext();
  const admissions = await db.admissions.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, orderBy: { created_at: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Admisiones</h2><p className="text-sm text-slate-500">{admissions.length} preinscripciones</p></div>
        <NewAdmissionButton />
      </div>
      <AdmissionTable admissions={admissions} />
    </div>
  );
}
