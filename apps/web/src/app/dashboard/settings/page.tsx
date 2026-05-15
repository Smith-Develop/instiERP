import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { SettingsForm } from "@/modules/settings/settings-form";

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });
  const academicYears = await db.academic_years.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { start_date: "desc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Configuración</h2>
      <SettingsForm school={school} academicYears={academicYears} />
    </div>
  );
}
