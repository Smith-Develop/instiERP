import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";

export default async function EnrollmentsPage() {
  const ctx = await getSessionContext();

  const enrollments = await db.enrollments.findMany({
    where: { school_id: ctx.schoolId, academic_year_id: ctx.academicYearId, deleted_at: null },
    include: { student: { select: { first_name: true, last_name: true } }, grade: true, section: true },
    orderBy: { enrolled_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Matrículas</h2><p className="text-sm text-slate-500">{enrollments.length} matrículas activas</p></div>
        <a href="/dashboard/enrollments/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nueva matrícula</a>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead><tr className="border-b bg-slate-50">{["Estudiante","Grado","Sección","Fecha"].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
          <tbody>
            {enrollments.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400">No hay matrículas</td></tr> :
              enrollments.map(e => (
                <tr key={e.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium text-sm">{e.student.last_name}, {e.student.first_name}</td>
                  <td className="p-4 text-sm text-slate-500">{e.grade.name}</td>
                  <td className="p-4 text-sm text-slate-500">{e.section.name}</td>
                  <td className="p-4 text-sm text-slate-500">{new Date(e.enrolled_at).toLocaleDateString("es-ES")}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
