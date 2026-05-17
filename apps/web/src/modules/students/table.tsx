"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@insti/ui";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { StudentProfileModal } from "@/modules/students/student-profile-modal";

type Student = {
  id: string; first_name: string; last_name: string; document_number: string | null;
  is_active: boolean; enrollments: { grade: { name: string }; section: { name: string } }[];
};

export function StudentTable({ students, search, page, totalPages }: { students: Student[]; search: string; page: number; totalPages: number }) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); doSearch(); }} className="flex gap-2">
        <Input placeholder="Buscar por nombre o documento..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="max-w-md"/>
        <Button type="submit" variant="outline"><Search className="h-4 w-4"/></Button>
      </form>

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
              <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">No se encontraron estudiantes</td></tr>
            ) : students.map(student => {
              const enrollment = student.enrollments[0];
              return (
                <tr key={student.id} className="border-b transition-colors hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900 cursor-pointer" onClick={() => setSelectedId(student.id)}>
                    {student.last_name}, {student.first_name}
                  </td>
                  <td className="p-4 text-sm text-slate-500">{student.document_number ?? "—"}</td>
                  <td className="p-4 text-sm">{enrollment ? `${enrollment.grade.name} ${enrollment.section.name}` : <span className="text-slate-400">Sin matrícula</span>}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${student.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{student.is_active ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelectedId(student.id)} className="text-sm text-[#2563EB] hover:underline">
                      Ver
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Página {page} de {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => goPage(page - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4"/> Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => goPage(page + 1)} disabled={page >= totalPages}>Siguiente <ChevronRight className="h-4 w-4"/></Button>
          </div>
        </div>
      )}

      {selectedId && <StudentProfileModal studentId={selectedId} open={true} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
