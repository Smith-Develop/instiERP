import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { AttendanceGrid } from "@/modules/attendance/attendance-grid";

export default async function AttendancePage() {
  const ctx = await getSessionContext();

  const sections = await db.sections.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { grade: true },
    orderBy: [{ grade: { sort_order: "asc" } }, { sort_order: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Asistencia</h2>
        <p className="text-sm text-slate-500">Pasa lista y registra la asistencia diaria</p>
      </div>

      <AttendanceGrid
        sections={sections.map((s) => ({
          id: s.id,
          label: `${s.grade.name} ${s.name}`,
        }))}
        schoolId={ctx.schoolId}
        academicYearId={ctx.academicYearId}
      />
    </div>
  );
}
