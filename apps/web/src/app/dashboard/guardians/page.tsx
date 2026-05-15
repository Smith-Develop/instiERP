import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { GuardianTable } from "@/modules/guardians/table";

export default async function GuardiansPage() {
  const ctx = await getSessionContext();
  const guardians = await db.guardians.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { last_name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tutores</h2>
          <p className="text-sm text-slate-500">{guardians.length} registrados</p>
        </div>
        <a href="/dashboard/guardians/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nuevo tutor</a>
      </div>
      <GuardianTable guardians={guardians} />
    </div>
  );
}
