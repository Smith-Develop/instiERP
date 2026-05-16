"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button, Label } from "@insti/ui";
import { Plus, Trash2 } from "lucide-react";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HOURS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];

type Schedule = { id: string; day_of_week: number; start_time: string; end_time: string; classroom: string | null; teacher: { first_name: string; last_name: string }; subject: { name: string }; grade: { name: string }; section: { name: string } | null };
type Teacher = { id: string; first_name: string; last_name: string };
type Subject = { id: string; name: string };
type Section = { id: string; name: string; grade: { name: string } };

export function SchedulesView({ schedules, teachers, subjects, sections }: { schedules: Schedule[]; teachers: Teacher[]; subjects: Subject[]; sections: Section[] }) {
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState(""); const [subjectId, setSubjectId] = useState(""); const [sectionId, setSectionId] = useState("");
  const [day, setDay] = useState("1"); const [start, setStart] = useState("08:00"); const [end, setEnd] = useState("09:00");
  const [classroom, setClassroom] = useState("");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId, section_id: sectionId || undefined, day_of_week: Number(day), start_time: start, end_time: end, classroom: classroom || undefined }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
    },
    onSuccess: () => { queryClient.invalidateQueries(); setError(""); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/schedules/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  // Group by day
  const byDay = new Map<number, Schedule[]>();
  for (let d = 1; d <= 6; d++) byDay.set(d, []);
  for (const s of schedules) { const list = byDay.get(s.day_of_week); if (list) list.push(s); }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Horarios</h2><p className="text-sm text-slate-500">{schedules.length} clases programadas</p></div>

      {/* Create form */}
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
