"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Label } from "@insti/ui";
import { Loader2, ArrowRight } from "lucide-react";

type Section = { id: string; label: string; gradeId: string; gradeName: string };
type AcademicYear = { id: string; year_label: string };
type Student = { id: string; first_name: string; last_name: string };

async function fetchData() {
  const [sectionsR, yearsR] = await Promise.all([
    fetch("/api/academic/sections"), fetch("/api/academic/years"),
  ]);
  const sectionsD = await sectionsR.json().catch(() => ({ data: [] }));
  const yearsD = await yearsR.json().catch(() => ({ data: { items: [] } }));
  return { sections: sectionsD.data as Section[] ?? [], years: yearsD.data?.items as AcademicYear[] ?? [] };
}

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [selectedGrade, setSelectedGrade] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["promotions-data"], queryFn: fetchData });
  const sections = data?.sections ?? []; const years = data?.years ?? [];

  // Fetch students in selected grade
  const { data: students = [] } = useQuery({
    queryKey: ["promotions-students", selectedGrade],
    queryFn: async () => {
      if (!selectedGrade) return [] as Student[];
      const r = await fetch(`/api/students?gradeId=${selectedGrade}&pageSize=200`);
      const d = await r.json().catch(() => ({ data: { items: [] } }));
      return (d.data?.items ?? []) as Student[];
    },
    enabled: !!selectedGrade,
  });

  // Get sections for the selected grade
  const gradeOptions: { id: string; name: string }[] = [];
  for (const s of sections) {
    if (!gradeOptions.find(g => g.id === s.gradeId)) {
      gradeOptions.push({ id: s.gradeId, name: s.gradeName });
    }
  }

  const availableSectionsForGrade: { id: string; label: string }[] = sections.map(s => ({ id: s.id, label: s.label }));

  const promoteMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/enrollments/promote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_ids: [...selectedStudents], target_academic_year_id: targetYear, target_grade_id: selectedGrade, target_section_id: targetSection }),
      });
      if (!r.ok) throw new Error((await r.json().catch(()=>({}))).error || "Error");
      return r.json();
    },
    onSuccess: (data: { promoted: string[]; errors: { error: string }[] }) => {
      queryClient.invalidateQueries();
      setSelectedStudents(new Set());
      if (data.errors?.length) setError(`${data.promoted.length} promovidos, ${data.errors.length} errores`);
      else setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Promociones</h2><p className="text-sm text-slate-500">Promover estudiantes al siguiente año lectivo</p></div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Grado origen</Label>
            <select value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setSelectedStudents(new Set()); }} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
              <option value="">Seleccionar</option>
              {gradeOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Año destino</Label>
            <select value={targetYear} onChange={e => setTargetYear(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
              <option value="">Seleccionar</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.year_label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Sección destino</Label>
            <select value={targetSection} onChange={e => setTargetSection(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
              <option value="">Seleccionar</option>
              {availableSectionsForGrade.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {selectedGrade && students.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700">{students.length} estudiantes</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedStudents(new Set(students.map(s => s.id)))}>Seleccionar todos</Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedStudents(new Set())}>Deseleccionar</Button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {students.map(s => (
                <label key={s.id} className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-slate-50 ${selectedStudents.has(s.id) ? "border-[#1E3A5F] bg-[#1E3A5F]/5" : "border-slate-200"}`}>
                  <input type="checkbox" checked={selectedStudents.has(s.id)} onChange={() => { const next = new Set(selectedStudents); next.has(s.id) ? next.delete(s.id) : next.add(s.id); setSelectedStudents(next); }} className="h-4 w-4" />
                  <span className="text-sm font-medium">{s.last_name}, {s.first_name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="border-t pt-4">
          <Button onClick={() => promoteMut.mutate()} disabled={selectedStudents.size === 0 || !targetYear || !targetSection || promoteMut.isPending}>
            <ArrowRight className="h-4 w-4" /> {promoteMut.isPending ? "Promoviendo..." : `Promover ${selectedStudents.size} estudiante${selectedStudents.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
