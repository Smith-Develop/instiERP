import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";

export default async function DocumentsPage() {
  const ctx = await getSessionContext();

  // Get recent documents across all entities
  const docs = await db.documents.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { created_at: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Documentos</h2>
        <p className="text-sm text-slate-500">{docs.length} documentos del colegio</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead><tr className="border-b bg-slate-50">{["Archivo","Tipo","Entidad","Tamaño","Fecha","Acción"].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
          <tbody>
            {docs.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-sm text-slate-400">No hay documentos. Súbelos desde el perfil del estudiante o admisión.</td></tr> :
              docs.map(d => (
                <tr key={d.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 text-sm font-medium text-slate-900">{d.original_name}</td>
                  <td className="p-4 text-sm text-slate-500">{d.entity_type}</td>
                  <td className="p-4 text-sm text-slate-500">{d.entity_id?.slice(0,8)}...</td>
                  <td className="p-4 text-sm text-slate-500">{(d.size_bytes / 1024).toFixed(0)} KB</td>
                  <td className="p-4 text-sm text-slate-500">{new Date(d.created_at).toLocaleDateString("es-ES")}</td>
                  <td className="p-4"><a href={d.url} target="_blank" className="text-sm text-[#2563EB] hover:underline">Descargar</a></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
