"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const schema = z.object({
  student_id: z.string().min(1, "Selecciona un estudiante"),
  type: z.string().optional(),
  severity: z.string().optional(),
  description: z.string().min(1, "Descripción requerida"),
});

type FormData = z.infer<typeof schema>;

export default function NewBehaviorPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/students").then(r => r.json()).then(d => {
      if (d.data?.items) setStudents(d.data.items.map((s: { id: string; first_name: string; last_name: string }) => ({ id: s.id, name: `${s.last_name}, ${s.first_name}` })));
    });
  }, []);

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/behavior", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear");
      router.push("/dashboard/behavior"); router.refresh();
    } catch (err) { setError("root", { message: err instanceof Error ? err.message : "Error" }); }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/behavior" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nuevo reporte</h2></div></div>
      <Card><form onSubmit={handleSubmit(onSubmit)}><CardHeader><CardTitle>Reporte de conducta</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><Label>Estudiante *</Label><select {...register("student_id")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Seleccionar</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>{errors.student_id && <p className="text-xs text-red-600">{errors.student_id.message}</p>}</div>
        <div className="space-y-2"><Label>Tipo</Label><select {...register("type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="OBSERVACION">Observación</option><option value="FELICITACION">Felicitación</option><option value="INCIDENCIA">Incidencia</option><option value="SANCION">Sanción</option></select></div>
        <div className="space-y-2"><Label>Severidad</Label><select {...register("severity")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="LEVE">Leve</option><option value="MODERADO">Moderado</option><option value="GRAVE">Grave</option></select></div>
        <div className="space-y-2"><Label>Descripción *</Label><textarea {...register("description")} rows={3} className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"/>{errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}</div>
        {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
      </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/behavior"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar"}</Button></CardFooter></form></Card>
    </div>
  );
}
