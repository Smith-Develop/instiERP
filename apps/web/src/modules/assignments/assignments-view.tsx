"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Label } from "@insti/ui";
import { Plus, Trash2 } from "lucide-react";

type Assignment = { id: string; teacher: { first_name: string; last_name: string }; subject: { name: string }; grade: { name: string }; section: { name: string } | null };
type Teacher = { id: string; first_name: string; last_name: string };
type Subject = { id: string; name: string };
type Section = { id: string; name: string; grade_id: string; grade: { name: string } };

export function AssignmentsView({
  assignments, teachers, subjects, sections,
}: {
  assignments: Assignment[]; teachers: Teacher[]; subjects: Subject[]; sections: Section[];
}) {
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const section = sections.find(s => s.id === sectionId);
      if (!section) throw new Error("Sección no encontrada");
      const res = await fetch("/api/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId, grade_id: section.grade_id, section_id: sectionId }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries(); setTeacherId(""); setSubjectId(""); setSectionId(""); setError(""); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/assignments/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Asignaciones</h2><p className="text-sm text-slate-500">{assignments.length} asignaciones</p></div>

      {/* Create form */}
      <Card><CardHeader><CardTitle className="text-base">Nueva asignación</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>Profesor</Label><select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Seleccionar</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.last_name}, {t.first_name}</option>)}</select></div>
          <div className="space-y-2"><Label>Asignatura</Label><select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Seleccionar</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="space-y-2"><Label>Sección</Label><select value={sectionId} onChange={e => setSectionId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Seleccionar</option>{sections.map(s => <option key={s.id} value={s.id}>{s.grade.name} {s.name}</option>)}</select></div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent><CardFooter className="border-t pt-4"><Button onClick={() => createMutation.mutate()} disabled={!teacherId || !subjectId || !sectionId || createMutation.isPending}><Plus className="h-4 w-4"/> {createMutation.isPending ? "Creando..." : "Asignar"}</Button></CardFooter></Card>

      {/* List */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead><tr className="border-b bg-slate-50">{["Profesor","Asignatura","Grado/Sección","Acción"].map(h => <th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
          <tbody>
            {assignments.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400">Sin asignaciones</td></tr> :
              assignments.map(a => (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 text-sm font-medium">{a.teacher.last_name}, {a.teacher.first_name}</td>
                  <td className="p-4 text-sm text-slate-500">{a.subject.name}</td>
                  <td className="p-4 text-sm text-slate-500">{a.grade.name}{a.section ? ` ${a.section.name}` : ""}</td>
                  <td className="p-4"><button onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending && deleteMutation.variables === a.id} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
