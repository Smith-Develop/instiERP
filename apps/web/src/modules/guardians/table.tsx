"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

type Guardian = { id: string; first_name: string; last_name: string; relationship: string | null; phone: string | null; email: string | null };

export function GuardianTable({ guardians }: { guardians: Guardian[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este tutor?")) return;
    setDeletingId(id);
    await fetch(`/api/guardians/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead><tr className="border-b bg-slate-50">{["Tutor","Parentesco","Teléfono","Email","Acciones"].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
        <tbody>
          {guardians.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">No hay tutores</td></tr> :
            guardians.map(g => (
              <tr key={g.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{g.last_name}, {g.first_name}</td>
                <td className="p-4 text-sm text-slate-500">{g.relationship ?? "—"}</td>
                <td className="p-4 text-sm text-slate-500">{g.phone ?? "—"}</td>
                <td className="p-4 text-sm text-slate-500">{g.email ?? "—"}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a href={`/dashboard/guardians/${g.id}`} className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#2563EB]" title="Editar"><Pencil className="h-4 w-4"/></a>
                    <button onClick={()=>handleDelete(g.id)} disabled={deletingId===g.id} className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Eliminar"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </td>
              </tr>))
          }
        </tbody>
      </table>
    </div>
  );
}
