"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const schema = z.object({
  student_id: z.string().min(1, "Requerido"),
  section_id: z.string().min(1, "Requerido"),
});

type FormData = z.infer<typeof schema>;

export default function NewEnrollmentPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/students").then(r => r.json()).then(d => { if (d.data?.items) setStudents(d.data.items.map((s: { id: string; first_name: string; last_name: string }) => ({ id: s.id, name: `${s.last_name}, ${s.first_name}` }))); });
    fetch("/api/academic/sections").then(r => r.json()).then(d => { if (d.data) setSections(d.data); });
  }, []);

  async function onSubmit(data: FormData) {
    try { const res = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!res.ok) throw new Error("Error"); router.push("/dashboard/students"); router.refresh(); }
    catch (err) { setError("root", { message: err instanceof Error ? err.message : "Error" }); }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/students" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nueva matrícula</h2></div></div>
      <Card><form onSubmit={handleSubmit(onSubmit)}><CardHeader><CardTitle>Matrícula</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><Label>Estudiante *</Label><select {...register("student_id")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Seleccionar</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{errors.student_id && <p className="text-xs text-red-600">{errors.student_id.message}</p>}</div>
        <div className="space-y-2"><Label>Sección *</Label><select {...register("section_id")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Seleccionar</option>{sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>{errors.section_id && <p className="text-xs text-red-600">{errors.section_id.message}</p>}</div>
        {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
      </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/students"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Matriculando..." : "Matricular"}</Button></CardFooter></form></Card>
    </div>
  );
}
