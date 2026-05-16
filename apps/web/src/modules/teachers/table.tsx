"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

type Teacher = {
  id: string;
  first_name: string;
  last_name: string;
  specialties: string | null;
  is_active: boolean;
  teacher_assignments: {
    subject: { name: string };
    grade: { name: string };
    section: { name: string } | null;
  }[];
};

export function TeacherTable({ teachers }: { teachers: Teacher[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/teachers/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries(); router.refresh(); },
  });

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este profesor?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Profesor</th>
            <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Especialidades</th>
            <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Asignaciones</th>
            <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Estado</th>
            <th className="h-12 px-4 text-right text-xs font-medium uppercase text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {teachers.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-sm text-slate-400">No hay profesores registrados</td>
            </tr>
          ) : (
            teachers.map((teacher) => (
              <tr key={teacher.id} className="border-b transition-colors hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{teacher.last_name}, {teacher.first_name}</td>
                <td className="p-4 text-sm text-slate-500">{teacher.specialties ?? "—"}</td>
                <td className="p-4 text-sm text-slate-500">
                  {teacher.teacher_assignments.length > 0
                    ? teacher.teacher_assignments.map((a) => `${a.subject.name} (${a.grade.name}${a.section?.name ? ` ${a.section.name}` : ""})`).join(", ")
                    : "—"}
                </td>
                <td className="p-4">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${teacher.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {teacher.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a href={`/dashboard/teachers/${teacher.id}`} className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#2563EB]" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === teacher.id}
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
