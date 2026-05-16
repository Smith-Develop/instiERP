"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

type Subject = { id: string; name: string; code: string | null; description: string | null };

export function SubjectTable({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/subjects/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries(); router.refresh(); },
  });

  function handleDelete(id: string) { if (!confirm("¿Eliminar?")) return; deleteMutation.mutate(id); }
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead><tr className="border-b bg-slate-50">{["Nombre","Código","Descripción","Acciones"].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
        <tbody>
          {subjects.length===0 ? <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400">No hay asignaturas</td></tr> :
            subjects.map(s=>(<tr key={s.id} className="border-b hover:bg-slate-50"><td className="p-4 font-medium text-slate-900">{s.name}</td><td className="p-4 text-sm text-slate-500">{s.code??"—"}</td><td className="p-4 text-sm text-slate-500">{s.description??"—"}</td><td className="p-4 text-right"><div className="flex items-center justify-end gap-1"><a href={`/dashboard/subjects/${s.id}`} className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#2563EB]" title="Editar"><Pencil className="h-4 w-4"/></a><button onClick={()=>handleDelete(s.id)} disabled={deleteMutation.isPending && deleteMutation.variables===s.id} className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Eliminar"><Trash2 className="h-4 w-4"/></button></div></td></tr>))
          }
        </tbody>
      </table>
    </div>
  );
}
