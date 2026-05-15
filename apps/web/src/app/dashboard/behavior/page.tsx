import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";

export default async function BehaviorPage() {
  const ctx = await getSessionContext();

  const reports = await db.behavior_reports.findMany({
    where: { school_id: ctx.schoolId, academic_year_id: ctx.academicYearId, deleted_at: null },
    include: { student: { select: { first_name: true, last_name: true } } },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  const severityColor = (s: string | null) =>
    s === "GRAVE" ? "bg-red-50 text-red-700" : s === "MODERADO" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Observaciones y Conducta</h2>
          <p className="text-sm text-slate-500">{reports.length} registros recientes</p>
        </div>
        <a href="/dashboard/behavior/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nuevo reporte</a>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead><tr className="border-b bg-slate-50">{["Estudiante","Tipo","Severidad","Descripción","Fecha"].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
          <tbody>
            {reports.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">No hay observaciones</td></tr> :
              reports.map(r => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{r.student.last_name}, {r.student.first_name}</td>
                  <td className="p-4 text-sm">{r.type}</td>
                  <td className="p-4"><span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${severityColor(r.severity)}`}>{r.severity ?? "LEVE"}</span></td>
                  <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{r.description}</td>
                  <td className="p-4 text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString("es-ES")}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
