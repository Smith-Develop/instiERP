import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { GradesSheet } from "@/modules/grades/grades-sheet";

export default async function GradesPage() {
  const ctx = await getSessionContext();

  const sections = await db.sections.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { grade: true },
    orderBy: [{ grade: { sort_order: "asc" } }, { sort_order: "asc" }],
  });

  const subjects = await db.subjects.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Calificaciones</h2>
        <p className="text-sm text-slate-500">
          Registra notas por criterio de evaluación
        </p>
      </div>

      <GradesSheet
        sections={sections.map((s) => ({
          id: s.id,
          label: `${s.grade.name} ${s.name}`,
          gradeId: s.grade_id,
        }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        schoolId={ctx.schoolId}
        academicYearId={ctx.academicYearId}
      />
    </div>
  );
}
