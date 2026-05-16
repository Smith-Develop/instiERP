"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  document_number: string | null;
  is_active: boolean;
  enrollments: {
    grade: { name: string };
    section: { name: string };
  }[];
};

export function StudentTable({
  students,
  search,
  page,
  totalPages,
}: {
  students: Student[];
  search: string;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const queryClient = useQueryClient();

  function doSearch() {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    router.push(`/dashboard/students?${params.toString()}`);
  }

  function goPage(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (p > 1) params.set("page", String(p));
    router.push(`/dashboard/students?${params.toString()}`);
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/students/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries(); router.refresh(); },
  });

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este estudiante?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); doSearch(); }}
        className="flex gap-2"
      >
        <Input
          placeholder="Buscar por nombre o documento..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Estudiante</th>
              <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Documento</th>
              <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Curso</th>
              <th className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">Estado</th>
              <th className="h-12 px-4 text-right text-xs font-medium uppercase text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                  No se encontraron estudiantes
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const enrollment = student.enrollments[0];
                return (
                  <tr key={student.id} className="border-b transition-colors hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{student.last_name}, {student.first_name}</td>
                    <td className="p-4 text-sm text-slate-500">{student.document_number ?? "—"}</td>
                    <td className="p-4 text-sm">
                      {enrollment ? `${enrollment.grade.name} ${enrollment.section.name}` : <span className="text-slate-400">Sin matrícula</span>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${student.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {student.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/dashboard/students/${student.id}`} className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#2563EB]" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === student.id}
                          className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => goPage(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => goPage(page + 1)} disabled={page >= totalPages}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
