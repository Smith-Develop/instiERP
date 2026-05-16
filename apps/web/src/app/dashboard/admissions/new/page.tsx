"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const schema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1), document_type: z.string().optional(),
  document_number: z.string().optional(), birth_date: z.string().optional(), gender: z.string().optional(),
  address: z.string().optional(), desired_grade_id: z.string().optional(),
  guardian_name: z.string().optional(), guardian_relationship: z.string().optional(),
  guardian_phone: z.string().optional(), guardian_email: z.string().email().optional().or(z.literal("")),
  medical_notes: z.string().optional(), emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(), notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewAdmissionPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/academic/sections").then(r => r.json()).then(d => {
      if (d.data) {
        const map = new Map<string, string>();
        for (const s of d.data as { gradeId: string; gradeName: string }[]) { if (!map.has(s.gradeId)) map.set(s.gradeId, s.gradeName); }
        setGrades([...map.entries()].map(([id, name]) => ({ id, name })));
      }
    });
  }, []);

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/admissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || "Error");
      router.push("/dashboard/admissions"); router.refresh();
    } catch (err) { setError("root", { message: err instanceof Error ? err.message : "Error" }); }
  }

  const F = "space-y-2";
  const L = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">{children}</label>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/admissions" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nueva admisión</h2><p className="text-sm text-slate-500">Registra una preinscripción completa</p></div></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>Datos del estudiante</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><L>Nombre *</L><Input {...register("first_name")}/>{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div><div className={F}><L>Apellidos *</L><Input {...register("last_name")}/>{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div></div>
          <div className="grid gap-4 sm:grid-cols-3"><div className={F}><L>Tipo doc.</L><select {...register("document_type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div><div className={F}><L>Número</L><Input {...register("document_number")}/></div><div className={F}><L>Nacimiento</L><Input type="date" {...register("birth_date")}/></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><L>Género</L><select {...register("gender")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="M">M</option><option value="F">F</option></select></div><div className={F}><L>Dirección</L><Input {...register("address")}/></div></div>
          <div className={F}><L>Grado al que aspira</L><select {...register("desired_grade_id")} className="flex h-10 w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option>{grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Datos del tutor</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><L>Nombre tutor</L><Input {...register("guardian_name")}/></div><div className={F}><L>Parentesco</L><Input {...register("guardian_relationship")} placeholder="Padre"/></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><L>Teléfono tutor</L><Input type="tel" {...register("guardian_phone")}/></div><div className={F}><L>Email tutor</L><Input type="email" {...register("guardian_email")}/>{errors.guardian_email && <p className="text-xs text-red-600">{errors.guardian_email.message}</p>}</div></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Datos adicionales</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className={F}><L>Notas médicas</L><Input {...register("medical_notes")}/></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><L>Contacto emergencia</L><Input {...register("emergency_contact")}/></div><div className={F}><L>Tel. emergencia</L><Input type="tel" {...register("emergency_phone")}/></div></div>
          <div className={F}><L>Notas adicionales</L><Input {...register("notes")}/></div>
          {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/admissions"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar admisión"}</Button></CardFooter></Card>
      </form>
    </div>
  );
}
