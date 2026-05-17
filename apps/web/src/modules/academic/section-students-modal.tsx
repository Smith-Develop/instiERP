"use client";

import { useQuery } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";

type Student = { id: string; first_name: string; last_name: string; document_number: string | null };

export function SectionStudentsModal({ open, onClose, sectionId, sectionName }: { open: boolean; onClose: () => void; sectionId: string; sectionName: string }) {
  const { data: students, isLoading } = useQuery({
    queryKey: ["section-students", sectionId],
    queryFn: async () => {
      const r = await fetch(`/api/academic/sections/${sectionId}/students`);
      const d = await r.json().catch(() => ({ data: [] }));
      return (d.data ?? []) as Student[];
    },
    enabled: open && !!sectionId,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-2xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Estudiantes · {sectionName}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : !students || students.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No hay estudiantes en esta sección.</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b bg-slate-50">{["Nombre","Documento"].map(h=><th key={h} className="h-10 px-3 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-sm font-medium text-slate-900">{s.last_name}, {s.first_name}</td>
                    <td className="p-3 text-sm text-slate-500">{s.document_number ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t bg-slate-50 px-6 py-3 text-xs text-slate-400">{students?.length ?? 0} estudiantes</div>
      </div>
    </div>
  );
}
