"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

type Admission = {
  id: string;
  first_name: string;
  last_name: string;
  document_number: string | null;
  status: string;
  created_at: Date;
};

export function AdmissionTable({ admissions }: { admissions: Admission[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/admissions/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries(); router.refresh(); },
  });

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta admisión?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Solicitante</th>
            <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Documento</th>
            <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Estado</th>
            <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Fecha</th>
            <th className="h-12 px-4 text-right text-xs font-medium uppercase text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {admissions.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-sm text-slate-400">No hay admisiones</td>
            </tr>
          ) : (
            admissions.map((a) => (
              <tr key={a.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{a.last_name}, {a.first_name}</td>
                <td className="p-4 text-sm text-slate-500">{a.document_number ?? "—"}</td>
                <td className="p-4">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                    a.status === "APROBADO" ? "bg-emerald-50 text-emerald-700"
                    : a.status === "RECHAZADO" ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-500">{new Date(a.created_at).toLocaleDateString("es-ES")}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a href={`/dashboard/admissions/${a.id}`} className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#2563EB]" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === a.id}
                      className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
