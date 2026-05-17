"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button, Label } from "@insti/ui";
import { Plus, Trash2, Loader2 } from "lucide-react";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HOURS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];

type Schedule = { id: string; day_of_week: number; start_time: string; end_time: string; classroom: string | null; teacher: { first_name: string; last_name: string }; subject: { name: string }; grade: { name: string }; section: { name: string } | null };
type Teacher = { id: string; first_name: string; last_name: string };
type Subject = { id: string; name: string };
type Section = { id: string; name: string; grade: { name: string }; grade_id: string };

export function SchedulesView({ schedules, teachers, subjects, sections, filterSectionId }: { schedules: Schedule[]; teachers: Teacher[]; subjects: Subject[]; sections: Section[]; filterSectionId?: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter
  const [showFilterSectionId, setShowFilterSectionId] = useState(filterSectionId ?? "");

  // Individual form
  const [teacherId, setTeacherId] = useState(""); const [subjectId, setSubjectId] = useState(""); const [sectionId, setSectionId] = useState("");
  const [day, setDay] = useState("1"); const [start, setStart] = useState("08:00"); const [end, setEnd] = useState("09:00");
  const [classroom, setClassroom] = useState("");
  const [error, setError] = useState("");

  // Batch section form
  const [batchSection, setBatchSection] = useState("");
  const [batchEntries, setBatchEntries] = useState<{ day_of_week: number; start_time: string; end_time: string; subject_id: string; teacher_id: string; classroom: string }[]>([]);
  const [batchDay, setBatchDay] = useState("1"); const [batchStart, setBatchStart] = useState("08:00"); const [batchEnd, setBatchEnd] = useState("09:00");
  const [batchSubject, setBatchSubject] = useState(""); const [batchTeacher, setBatchTeacher] = useState(""); const [batchClassroom, setBatchClassroom] = useState("");

  function handleFilterChange(sid: string) {
    setShowFilterSectionId(sid);
    const params = new URLSearchParams(searchParams.toString());
    if (sid) { params.set("section", sid); } else { params.delete("section"); }
    router.push(`?${params.toString()}`);
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const section = sections.find(s => s.id === sectionId);
      const res = await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId, section_id: sectionId || undefined, grade_id: section?.grade_id, day_of_week: Number(day), start_time: start, end_time: end, classroom: classroom || undefined }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
    },
    onSuccess: () => { queryClient.invalidateQueries(); setError(""); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/schedules/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const batchCreateMutation = useMutation({
    mutationFn: async () => {
      const section = sections.find(s => s.id === batchSection);
      if (!section) throw new Error("Sección no encontrada");
      for (const entry of batchEntries) {
        await fetch("/api/schedules", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_id: entry.teacher_id, subject_id: entry.subject_id, section_id: batchSection, grade_id: section.grade_id, day_of_week: entry.day_of_week, start_time: entry.start_time, end_time: entry.end_time, classroom: entry.classroom || undefined }),
        });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(); setBatchEntries([]); setBatchSection(""); setError(""); },
    onError: (e: Error) => setError(e.message),
  });

  function addBatchEntry() {
    if (!batchSubject || !batchTeacher) return;
    setBatchEntries(prev => [...prev, { day_of_week: Number(batchDay), start_time: batchStart, end_time: batchEnd, subject_id: batchSubject, teacher_id: batchTeacher, classroom: batchClassroom }]);
    setBatchSubject(""); setBatchTeacher(""); setBatchClassroom("");
  }

  // Group by day
  const byDay = new Map<number, Schedule[]>();
  for (let d = 1; d <= 6; d++) byDay.set(d, []);
  for (const s of schedules) { const list = byDay.get(s.day_of_week); if (list) list.push(s); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-2xl font-bold text-slate-900">Horarios</h2><p className="text-sm text-slate-500">{schedules.length} clases programadas</p></div>
        <div className="space-y-1.5">
          <Label>Filtrar por sección</Label>
          <select value={showFilterSectionId} onChange={e => handleFilterChange(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
            <option value="">Todas las secciones</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.grade.name} {s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Individual create form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Añadir clase</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2"><Label>Día</Label><select value={day} onChange={e=>setDay(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">{DAYS.map((d,i)=><option key={i} value={i+1}>{d}</option>)}</select></div>
            <div className="space-y-2"><Label>Inicio</Label><select value={start} onChange={e=>setStart(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
            <div className="space-y-2"><Label>Fin</Label><select value={end} onChange={e=>setEnd(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
            <div className="space-y-2"><Label>Profesor</Label><select value={teacherId} onChange={e=>setTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.last_name}</option>)}</select></div>
            <div className="space-y-2"><Label>Asignatura</Label><select value={subjectId} onChange={e=>setSubjectId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="space-y-2"><Label>Sección</Label><select value={sectionId} onChange={e=>setSectionId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option>{sections.map(s=><option key={s.id} value={s.id}>{s.grade.name} {s.name}</option>)}</select></div>
          </div>
          <div className="flex items-end gap-3"><div className="space-y-2"><Label>Aula</Label><input value={classroom} onChange={e=>setClassroom(e.target.value)} placeholder="A101" className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"/></div><Button onClick={()=>createMutation.mutate()} disabled={!teacherId||!subjectId||!sectionId||createMutation.isPending}><Plus className="h-4 w-4"/> {createMutation.isPending?"Añadiendo...":"Añadir"}</Button></div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Batch section schedule creator */}
      <Card>
        <CardHeader><CardTitle className="text-base">Crear horario de una sección</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label>Sección</Label>
            <select value={batchSection} onChange={e => { setBatchSection(e.target.value); setBatchEntries([]); }} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
              <option value="">Seleccionar</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.grade.name} {s.name}</option>)}
            </select>
          </div>
          {batchSection && (
            <div className="space-y-4">
              <div className="flex items-end gap-2 flex-wrap">
                <div className="space-y-1.5"><Label>Día</Label><select value={batchDay} onChange={e=>setBatchDay(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm">{DAYS.map((d,i)=><option key={i} value={i+1}>{d}</option>)}</select></div>
                <div className="space-y-1.5"><Label>De</Label><select value={batchStart} onChange={e=>setBatchStart(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm">{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
                <div className="space-y-1.5"><Label>A</Label><select value={batchEnd} onChange={e=>setBatchEnd(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm">{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
                <div className="space-y-1.5"><Label>Asignatura</Label><select value={batchSubject} onChange={e=>setBatchSubject(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"><option value="">—</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="space-y-1.5"><Label>Profesor</Label><select value={batchTeacher} onChange={e=>setBatchTeacher(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"><option value="">—</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.last_name}</option>)}</select></div>
                <div className="space-y-1.5"><Label>Aula</Label><input value={batchClassroom} onChange={e=>setBatchClassroom(e.target.value)} placeholder="A101" className="h-10 w-24 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"/></div>
                <Button type="button" onClick={addBatchEntry} disabled={!batchSubject||!batchTeacher} className="h-10"><Plus className="h-4 w-4"/></Button>
              </div>
              {/* Pending entries */}
              {batchEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">{batchEntries.length} clases pendientes</span><Button size="sm" onClick={()=>batchCreateMutation.mutate()} disabled={batchCreateMutation.isPending}>{batchCreateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Guardar todo"}</Button></div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {batchEntries.map((e, i) => {
                      const subj = subjects.find(s => s.id === e.subject_id);
                      const tchr = teachers.find(t => t.id === e.teacher_id);
                      return (
                        <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
                          <span className="font-medium">{DAYS[e.day_of_week - 1]} {e.start_time}-{e.end_time}</span>
                          <span className="text-slate-500">{subj?.name} · {tchr?.last_name}{e.classroom ? ` · ${e.classroom}` : ""}</span>
                          <button onClick={() => setBatchEntries(prev => prev.filter((_, idx) => idx !== i))} className="ml-auto text-slate-400 hover:text-red-600"><Trash2 className="h-3 w-3"/></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid by day */}
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {DAYS.map((label, i) => {
          const daySchedules = byDay.get(i + 1) ?? [];
          return (
            <Card key={i}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {daySchedules.length === 0 ? <p className="text-xs text-slate-400">Sin clases</p> :
                  daySchedules.map(s => (
                    <div key={s.id} className="rounded-md border border-slate-200 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{s.start_time}-{s.end_time}</span>
                        <button onClick={()=>deleteMutation.mutate(s.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-3 w-3"/></button>
                      </div>
                      <p className="text-slate-600 mt-0.5">{s.subject.name}</p>
                      <p className="text-slate-400">{s.teacher.last_name} · {s.grade.name}{s.section?` ${s.section.name}`:""}{s.classroom?` · ${s.classroom}`:""}</p>
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
