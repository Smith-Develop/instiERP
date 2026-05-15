import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";

export default async function AcademicPage() {
  const ctx = await getSessionContext();

  const levels = await db.academic_levels.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: {
      grades: {
        where: { deleted_at: null },
        include: { sections: { where: { deleted_at: null } } },
        orderBy: { sort_order: "asc" },
      },
    },
    orderBy: { sort_order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración Académica</h2>
          <p className="text-sm text-slate-500">Niveles, grados y secciones</p>
        </div>
      </div>

      <div className="space-y-4">
        {levels.map((level) => (
          <div key={level.id} className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b bg-slate-50 px-6 py-3">
              <h3 className="text-lg font-semibold text-slate-900">{level.name}</h3>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {level.grades.map((grade) => (
                  <div key={grade.id} className="rounded-md border border-slate-200 p-4">
                    <h4 className="font-medium text-slate-900">{grade.name}</h4>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {grade.sections.map((section) => (
                        <span
                          key={section.id}
                          className="inline-flex rounded bg-[#1E3A5F]/10 px-2 py-0.5 text-xs font-medium text-[#1E3A5F]"
                        >
                          {section.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
