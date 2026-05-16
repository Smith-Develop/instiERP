"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { BookOpen, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

type Section = { id: string; label: string };
type Assignment = {
  id: string; title: string; type: string; due_date: Date | null; points: { toString: () => string } | null;
  subject: { name: string }; teacher: { first_name: string; last_name: string };
  submissions: { status: string; score: { toString: () => string } | null; feedback: string | null }[];
};

type Props = { sections: Section[]; assignments: Assignment[] };

export function StudentClassroom({ sections, assignments }: Props) {
  const now = new Date();

  const grouped = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const key = a.submissions[0]?.status === "ENTREGADO" || a.submissions[0]?.status === "CALIFICADO" ? "entregadas" : "pendientes";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  const pending = grouped.get("pendientes") ?? [];
  const done = grouped.get("entregadas") ?? [];

  const statusBadge = (a: Assignment) => {
    const s = a.submissions[0];
    if (!s) {
      if (a.due_date && new Date(a.due_date) < now) return <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600">Vencida</span>;
      return <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600">Pendiente</span>;
    }
    if (s.status === "CALIFICADO") return <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-600">{s.score ? Number(s.score).toFixed(1) : "—"}/10</span>;
    return <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600">Entregado</span>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Mis Tareas</h2>
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="h-4 w-4"/> {pending.length} pendientes</span>
        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-4 w-4"/> {done.length} completadas</span>
      </div>

      {sections.map(s => {
        const sectionAssignments = assignments.filter(a => a.submissions.length > 0 || true);
        if (sectionAssignments.length === 0) return null;
        return (
          <div key={s.id} className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500">{s.label}</h3>
            {assignments.filter(() => true).map(a => (
              <Link key={a.id} href={`/dashboard/classroom/assignments/${a.id}`}>
                <Card className="hover:border-slate-300 transition-colors">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-slate-400"/>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                    </div>
                    {statusBadge(a)}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{a.subject.name}</span>
                      <span>{a.teacher.last_name}, {a.teacher.first_name}</span>
                      {a.due_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {new Date(a.due_date).toLocaleDateString("es-ES")}</span>}
                      {a.points && <span>{String(a.points)} pts</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        );
      })}

      {assignments.length === 0 && (
        <Card><CardContent className="py-8 text-center text-sm text-slate-400">No tienes tareas asignadas por ahora.</CardContent></Card>
      )}
    </div>
  );
}
