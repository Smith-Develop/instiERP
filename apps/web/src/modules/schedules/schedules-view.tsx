"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button, Label } from "@insti/ui";
import { Plus, Trash2, Loader2 } from "lucide-react";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HOURS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];

type Schedule = { id: string; day_of_week: number; start_time: string; end_time: string; classroom: string | null; teacher: { first_name: string; last_name: string }; subject: { name: string }; grade: { name: string }; section: { name: string } | null; section_id: string | null };
type Teacher = { id: string; first_name: string; last_name: string };
type Subject = { id: string; name: string };
type Section = { id: string; name: string; grade: { name: string }; grade_id: string };
type TeacherAssign = { teacher_id: string; subject_id: string; section_id: string | null };

async function fetchSchedules(sectionId?: string) {
  const url = sectionId ? `/api/schedules?section=${sectionId}` : "/api/schedules";
  const r = await fetch(url);
  const d = await r.json();
  return (d.data?.items ?? []) as Schedule[];
}

export function SchedulesView({ teachers, subjects, sections, teacherAssignments }: { teachers: Teacher[]; subjects: Subject[]; sections: Section[]; teacherAssignments: TeacherAssign[] }) {
  const queryClient = useQueryClient();

  // Filter state
  const [filterSectionId, setFilterSectionId] = useState("");

  // Step-by-step creation form
  const [step, setStep] = useState<number>(0);
  const [selSection, setSelSection] = useState("");
  const [selDay, setSelDay] = useState("");
  const [selSubject, setSelSubject] = useState("");
  const [selTeacher, setSelTeacher] = useState("");
  const [selStart, setSelStart] = useState("");
  const [selEnd, setSelEnd] = useState("");
  const [selClassroom, setSelClassroom] = useState("");
  const [error, setError] = useState("");

  // Fetch schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules", filterSectionId],
    queryFn: () => fetchSchedules(filterSectionId || undefined),
  });

  // Filter available teachers for selected subject + section
  const availableTeachers = useMemo(() => {
    if (!selSubject) return teachers;
    const matchingAssignments = teacherAssignments.filter(a => a.subject_id === selSubject && (a.section_id === selSection || !a.section_id));
    const teacherIds = new Set(matchingAssignments.map(a => a.teacher_id));
    return teachers.filter(t => teacherIds.has(t.id));
  }, [selSubject, selSection, teachers, teacherAssignments]);

  // Filter available subjects for selected section
  const availableSubjects = useMemo(() => {
    if (!selSection) return subjects;
    const matchingAssignments = teacherAssignments.filter(a => a.section_id === selSection || !a.section_id);
    const subjectIds = new Set(matchingAssignments.map(a => a.subject_id));
    return subjects.filter(s => subjectIds.has(s.id));
  }, [selSection, subjects, teacherAssignments]);

  // Occupied time slots for selected section + day
  const occupiedSlots = useMemo(() => {
    if (!selSection || !selDay) return new Set<string>();
    const dayNum = Number(selDay);
    const daySchedules = schedules.filter(s => s.section_id === selSection && s.day_of_week === dayNum);
    const occupied = new Set<string>();
    for (const s of daySchedules) {
      const startIdx = HOURS.indexOf(s.start_time);
      const endIdx = HOURS.indexOf(s.end_time);
      if (startIdx >= 0 && endIdx > startIdx) {
        for (let i = startIdx; i < endIdx; i++) {
          occupied.add(`${HOURS[i]!}-${HOURS[i+1]!}`);
        }
      }
    }
    return occupied;
  }, [selSection, selDay, schedules]);

  // Available time slots (1-hour blocks)
  const availableSlots = useMemo(() => {
    const slots: { start: string; end: string; label: string }[] = [];
    for (let i = 0; i < HOURS.length - 1; i++) {
      const h1 = HOURS[i]!; const h2 = HOURS[i+1]!;
      const key = `${h1}-${h2}`;
      if (!occupiedSlots.has(key)) {
        slots.push({ start: h1, end: h2, label: `${h1} - ${h2}` });
      }
    }
    return slots;
  }, [occupiedSlots]);

  function resetForm() {
    setStep(0);
    setSelSection(""); setSelDay(""); setSelSubject(""); setSelTeacher("");
    setSelStart(""); setSelEnd(""); setSelClassroom(""); setError("");
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const section = sections.find(s => s.id === selSection);
      const res = await fetch("/api/schedules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: selTeacher, subject_id: selSubject, section_id: selSection, grade_id: section?.grade_id, day_of_week: Number(selDay), start_time: selStart, end_time: selEnd, classroom: selClassroom || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["schedules"] }); resetForm(); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/schedules/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });

  // Group by day
  const byDay = new Map<number, Schedule[]>();
  for (let d = 1; d <= 6; d++) byDay.set(d, []);
  for (const s of schedules) { const list = byDay.get(s.day_of_week); if (list) list.push(s); }

  function goNext(currentStep: number) {
    if (currentStep === 0 && !selSection) return;
    if (currentStep === 1 && !selDay) return;
    if (currentStep === 2 && !selSubject) return;
    if (currentStep === 3 && !selTeacher) return;
    if (currentStep === 4 && (!selStart || !selEnd)) return;
    setStep(currentStep + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-2xl font-bold text-slate-900">Horarios</h2><p className="text-sm text-slate-500">{schedules.length} clases programadas</p></div>
        <div className="space-y-1.5">
          <Label>Filtrar por sección</Label>
          <select value={filterSectionId} onChange={e => setFilterSectionId(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
            <option value="">Todas las secciones</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.grade.name} {s.name}</option>)}
          </select>
        </div>
      </div>

      {/* --- STEP-BY-STEP CREATION --- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Añadir clase</CardTitle>
            {step > 0 && <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress indicator */}
          <div className="flex gap-1">
            {["Sección","Día","Asignatura","Profesor","Horario"].map((label, i) => (
              <div key={label} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-[#1E3A5F]" : "bg-slate-200"}`}/>
            ))}
          </div>

          {/* Step 0: Section */}
          {step >= 0 && (
            <div className={`transition-all ${step === 0 ? "" : "opacity-50 pointer-events-none"}`}>
              <Label>1. Selecciona la sección</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {sections.map(s => (
                  <button key={s.id} onClick={() => { setSelSection(s.id); goNext(0); }} className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${selSection === s.id ? "border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {s.grade.name} {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Day */}
          {step >= 1 && (
            <div className={`transition-all ${step === 1 ? "" : "opacity-50 pointer-events-none"}`}>
              <Label>2. Selecciona el día</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map((d, i) => (
                  <button key={d} onClick={() => { setSelDay(String(i+1)); goNext(1); }} className={`inline-flex rounded-md border px-4 py-1.5 text-sm font-medium transition-colors ${selDay === String(i+1) ? "border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Subject */}
          {step >= 2 && (
            <div className={`transition-all ${step === 2 ? "" : "opacity-50 pointer-events-none"}`}>
              <Label>3. Selecciona la asignatura</Label>
              <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                {availableSubjects.length === 0 ? <p className="text-xs text-slate-400">No hay asignaturas disponibles para esta sección</p> :
                  availableSubjects.map(s => (
                    <button key={s.id} onClick={() => { setSelSubject(s.id); setSelTeacher(""); goNext(2); }} className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${selSubject === s.id ? "border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                      {s.name}
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* Step 3: Teacher */}
          {step >= 3 && (
            <div className={`transition-all ${step === 3 ? "" : "opacity-50 pointer-events-none"}`}>
              <Label>4. Selecciona el profesor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTeachers.length === 0 ? <p className="text-xs text-slate-400">No hay profesores disponibles para esta asignatura</p> :
                  availableTeachers.map(t => (
                    <button key={t.id} onClick={() => { setSelTeacher(t.id); goNext(3); }} className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${selTeacher === t.id ? "border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                      {t.last_name}, {t.first_name}
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* Step 4: Time slot */}
          {step >= 4 && (
            <div>
              <Label>5. Selecciona la franja horaria</Label>
              <p className="text-xs text-slate-400 mb-2">Horas disponibles para {DAYS[Number(selDay)-1]} · {sections.find(s=>s.id===selSection)?.grade.name} {sections.find(s=>s.id===selSection)?.name}</p>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-amber-600">No hay franjas disponibles para este día. Todas las horas están ocupadas.</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableSlots.map(slot => (
                    <button key={slot.start} onClick={() => { setSelStart(slot.start); setSelEnd(slot.end); }} className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${selStart === slot.start ? "border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-emerald-300"}`}>
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
              {selStart && selEnd && (
                <div className="flex items-end gap-3 mt-4">
                  <div className="space-y-1.5">
                    <Label>Aula (opcional)</Label>
                    <input value={selClassroom} onChange={e => setSelClassroom(e.target.value)} placeholder="A101" className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700" />
                  </div>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                    <Plus className="h-4 w-4" /> {createMutation.isPending ? "Añadiendo..." : "Añadir clase"}
                  </Button>
                </div>
              )}
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
          )}

          {/* Summary bar */}
          {step >= 1 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 border-t pt-3 mt-2">
              {selSection && <span>{sections.find(s=>s.id===selSection)?.grade.name} {sections.find(s=>s.id===selSection)?.name}</span>}
              {selDay && <span>· {DAYS[Number(selDay)-1]}</span>}
              {selSubject && <span>· {subjects.find(s=>s.id===selSubject)?.name}</span>}
              {selTeacher && <span>· Prof. {teachers.find(t=>t.id===selTeacher)?.last_name}</span>}
              {selStart && <span>· {selStart}-{selEnd}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid by day */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
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
                          <button onClick={() => deleteMutation.mutate(s.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-3 w-3"/></button>
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
      )}
    </div>
  );
}
