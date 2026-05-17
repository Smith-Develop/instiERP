"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Label } from "@insti/ui";
import { Plus, Trash2, Loader2 } from "lucide-react";

type Assignment = { id: string; teacher?: { first_name: string; last_name: string }; subject?: { name: string }; grade?: { name: string }; section?: { name: string } };
type Teacher = { id: string; first_name: string; last_name: string; specialties: string | null };
type Subject = { id: string; name: string };
type Section = { id: string; name: string; grade_id: string; grade?: { name: string } };

async function fetchAssignments() {
  const r = await fetch("/api/assignments");
  const d = await r.json().catch(() => ({ data: { items: [] } }));
  return (d.data?.items ?? []) as Assignment[];
}

async function fetchFormData() {
  const [teachersR, subjectsR, sectionsR] = await Promise.all([
    fetch("/api/teachers?pageSize=100"), fetch("/api/subjects"), fetch("/api/academic/sections"),
  ]);
  const [tD, sD, secD] = await Promise.all([teachersR.json(), subjectsR.json(), sectionsR.json()]);
  return { teachers: tD.data?.items as Teacher[] ?? [], subjects: sD.data?.items as Subject[] ?? [], sections: secD.data as Section[] ?? [] };
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sectionIds, setSectionIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const { data: assignments = [], isLoading } = useQuery({ queryKey: ["assignments-list"], queryFn: fetchAssignments });
  const { data: formData } = useQuery({ queryKey: ["assignments-form"], queryFn: fetchFormData });
  const teachers = formData?.teachers ?? []; const allSubjects = formData?.subjects ?? []; const sections = formData?.sections ?? [];

  const selectedTeacher = teachers.find(t => t.id === teacherId);
  const teacherSpecialties = selectedTeacher?.specialties
    ? selectedTeacher.specialties.split(",").map(s => s.trim().toLowerCase())
    : null;
  const filteredSubjects = teacherSpecialties
    ? allSubjects.filter(s => teacherSpecialties.includes(s.name.toLowerCase()))
    : allSubjects;

  const createMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const sectionId of sectionIds) {
        const section = sections.find(s => s.id === sectionId);
        if (!section) continue;
        const r = await fetch("/api/assignments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId, grade_id: section.grade_id, section_id: sectionId }),
        });
        if (!r.ok) throw new Error((await r.json().catch(()=>({}))).error || "Error");
        results.push(r);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assignments-list"] }); setTeacherId(""); setSubjectId(""); setSectionIds(new Set()); setError(""); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/assignments/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments-list"] }),
  });

  function toggleSection(id: string) {
    const next = new Set(sectionIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSectionIds(next);
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Asignaciones</h2><p className="text-sm text-slate-500">{assignments.length} asignaciones</p></div>

      <Card><CardHeader><CardTitle className="text-base">Nueva asignación</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Profesor</Label>
            <select value={teacherId} onChange={e=>{setTeacherId(e.target.value); setSubjectId(""); setSectionIds(new Set())}} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
              <option value="">Seleccionar</option>
              {teachers.map(t=><option key={t.id} value={t.id}>{t.last_name}, {t.first_name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Asignatura {teacherSpecialties && <span className="text-xs text-slate-400">(según especialidades)</span>}</Label>
            <select value={subjectId} onChange={e=>setSubjectId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
              <option value="">Seleccionar</option>
              {filteredSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {teacherSpecialties && filteredSubjects.length === 0 && teacherId && (
              <p className="text-xs text-amber-600">El profesor no tiene especialidades que coincidan con asignaturas.</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Secciones</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
            {sections.length === 0 ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> :
              sections.map(s => (
                <button key={s.id} type="button" onClick={() => toggleSection(s.id)}
                  className={`inline-flex rounded-md border px-3 py-1 text-xs font-medium transition-colors ${sectionIds.has(s.id) ? "border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {s.grade?.name ?? "—"} {s.name}
                </button>
              ))
            }
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent><CardFooter className="border-t pt-4"><Button onClick={()=>createMutation.mutate()} disabled={!teacherId||!subjectId||sectionIds.size===0||createMutation.isPending}><Plus className="h-4 w-4"/> {createMutation.isPending?"Creando...":`Asignar a ${sectionIds.size} sección${sectionIds.size!==1?"es":""}`}</Button></CardFooter></Card>

      <div className="rounded-lg border border-slate-200 bg-white">
        {isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400"/></div> :
        <table className="w-full">
          <thead><tr className="border-b bg-slate-50">{["Profesor","Asignatura","Grado/Sección",""].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
          <tbody>
            {assignments.length===0?<tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400">Sin asignaciones</td></tr>:
              assignments.map(a=>(<tr key={a.id} className="border-b hover:bg-slate-50">
                <td className="p-4 text-sm font-medium">{a.teacher?.last_name ?? "—"}, {a.teacher?.first_name ?? "—"}</td>
                <td className="p-4 text-sm text-slate-500">{a.subject?.name ?? "—"}</td>
                <td className="p-4 text-sm text-slate-500">{a.grade?.name ?? "—"}{a.section ? ` ${a.section.name}` : ""}</td>
                <td className="p-4 text-right"><button onClick={()=>deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending&&deleteMutation.variables===a.id} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></td>
              </tr>))
            }
          </tbody>
        </table>}
      </div>
    </div>
  );
}
