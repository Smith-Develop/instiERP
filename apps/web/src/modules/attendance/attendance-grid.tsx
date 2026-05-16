"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Check, X, Clock, FileText, Loader2, Users } from "lucide-react";

type SectionOption = { id: string; label: string };
type StudentAttendance = { studentId: string; studentName: string; status: "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO" };
type Props = { sections: SectionOption[]; schoolId: string; academicYearId: string };

const STATUS_CONFIG = {
  PRESENTE: { label: "Presente", color: "bg-emerald-50 text-emerald-700 border-emerald-200", next: "AUSENTE" as const },
  AUSENTE: { label: "Ausente", color: "bg-red-50 text-red-700 border-red-200", next: "TARDANZA" as const },
  TARDANZA: { label: "Tardanza", color: "bg-amber-50 text-amber-700 border-amber-200", next: "JUSTIFICADO" as const },
  JUSTIFICADO: { label: "Justificado", color: "bg-blue-50 text-blue-700 border-blue-200", next: "PRESENTE" as const },
};

async function fetchAttendance(sectionId: string, date: string) {
  const res = await fetch(`/api/attendance?sectionId=${sectionId}&date=${date}`);
  if (!res.ok) throw new Error("Error al cargar");
  const data = await res.json();
  return data.students as StudentAttendance[];
}

async function saveAttendance(body: { sectionId: string; date: string; schoolId: string; academicYearId: string; attendances: { studentId: string; status: string }[] }) {
  const res = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("Error al guardar");
  return res.json();
}

export function AttendanceGrid({ sections, schoolId, academicYearId }: Props) {
  const today = new Date().toISOString().split("T")[0]!;
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const { isLoading, error } = useQuery({
    queryKey: ["attendance", sectionId, date],
    queryFn: () => fetchAttendance(sectionId, date),
    enabled: !!sectionId,
  });

  // Sync query data to local state for toggling
  useEffect(() => {
    let cancelled = false;
    if (sectionId) {
      fetchAttendance(sectionId, date).then(data => {
        if (!cancelled) setStudents(data);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [sectionId, date]);

  const saveMutation = useMutation({
    mutationFn: saveAttendance,
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["attendance", sectionId, date] });
    },
  });

  function toggleStatus(studentId: string) {
    setStudents((prev) => prev.map((s) => s.studentId === studentId ? { ...s, status: STATUS_CONFIG[s.status].next } : s));
    setSaved(false);
  }

  function markAll(status: StudentAttendance["status"]) {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
    setSaved(false);
  }

  const counts = {
    total: students.length, presente: students.filter((s) => s.status === "PRESENTE").length,
    ausente: students.filter((s) => s.status === "AUSENTE").length, tardanza: students.filter((s) => s.status === "TARDANZA").length,
    justificado: students.filter((s) => s.status === "JUSTIFICADO").length,
  };

  return (
    <div className="space-y-4">
      <Card><CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Sección</label><select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="flex h-10 w-full min-w-[220px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]">{sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Fecha</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex h-10 w-full min-w-[180px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"/></div>
          <div className="flex items-end gap-2"><Button variant="outline" onClick={() => markAll("PRESENTE")}><Check className="h-4 w-4"/> Todos presentes</Button><Button variant="ghost" onClick={() => markAll("AUSENTE")}><X className="h-4 w-4"/> Todos ausentes</Button></div>
        </div>
      </CardContent></Card>

      {students.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1"><Users className="h-3.5 w-3.5 text-slate-400"/><span className="font-medium">{counts.total}</span> estudiantes</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700"><Check className="h-3.5 w-3.5"/>{counts.presente} presente</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-red-700"><X className="h-3.5 w-3.5"/>{counts.ausente} ausente</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700"><Clock className="h-3.5 w-3.5"/>{counts.tardanza} tardanza</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700"><FileText className="h-3.5 w-3.5"/>{counts.justificado} justificado</span>
        </div>
      )}

      <Card><CardHeader><CardTitle>Lista de asistencia</CardTitle></CardHeader><CardContent>
        {isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400"/></div>
        : error ? <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{(error as Error).message}</div>
        : students.length === 0 ? <div className="py-12 text-center text-sm text-slate-400">Selecciona una sección y fecha</div>
        : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{students.map((s) => <button key={s.studentId} onClick={() => toggleStatus(s.studentId)} className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition-all active:scale-[0.98] ${STATUS_CONFIG[s.status].color}`} style={{minHeight:"52px",touchAction:"manipulation"}}><span className="text-sm font-medium leading-tight">{s.studentName}</span><span className="text-xs font-semibold uppercase tracking-wider">{STATUS_CONFIG[s.status].label}</span></button>)}</div>}
      </CardContent>
        {students.length > 0 && <CardFooter className="flex gap-3 border-t pt-6"><Button onClick={() => saveMutation.mutate({ sectionId, date, schoolId, academicYearId, attendances: students.map((s) => ({ studentId: s.studentId, status: s.status })) })} disabled={saveMutation.isPending}>{saveMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin"/> Guardando...</> : saved ? <><Check className="h-4 w-4"/> Guardado</> : "Guardar asistencia"}</Button></CardFooter>}
      </Card>
    </div>
  );
}
