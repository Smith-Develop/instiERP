"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Section = { id: string; label: string; gradeId: string; gradeName: string };

export default function NewEnrollmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [studentId, setStudentId] = useState("");
  const [sectionId, setSectionId] = useState("");

  useEffect(() => {
    fetch("/api/students").then(r => r.json()).then(d => { if (d.data?.items) setStudents(d.data.items.map((s: { id: string; first_name: string; last_name: string }) => ({ id: s.id, name: `${s.last_name}, ${s.first_name}` }))); });
    fetch("/api/attendance?sections=1").then(() => {}).catch(() => {});
    // Get sections via a quick fetch to academic data
    fetch("/api/students").then(r => r.json()).then(() => {
      // Fallback: fetch sections from the server component data
      fetch("/api/grades/items?subjectId=none&gradeId=none").catch(() => {});
    });
  }, []);

  useEffect(() => {
    // Get grades/sections from the server via a dedicated endpoint
    fetch("/api/academic/sections").then(r => r.json()).then(d => {
      if (d.data) setSections(d.data);
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, grade_id: sections.find(s => s.id === sectionId)?.gradeId, section_id: sectionId, academic_year_id: "00000000-0000-0000-0000-000000000002" }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Error"); }
      router.push("/dashboard/students"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/students" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link>
        <div><h2 className="text-2xl font-bold text-slate-900">Nueva matrícula</h2><p className="text-sm text-slate-500">Matricula un estudiante en un curso</p></div>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle>Matrícula</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">Estudiante *</Label>
              <select id="student" value={studentId} onChange={e => setStudentId(e.target.value)} required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
                <option value="">Seleccionar estudiante</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Sección *</Label>
              <select id="section" value={sectionId} onChange={e => setSectionId(e.target.value)} required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
                <option value="">Seleccionar sección</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/students"><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Matricular"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
