"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const schema = z.object({
  first_name: z.string().min(1,"Requerido"), last_name: z.string().min(1,"Requerido"),
  document_type: z.string().optional(), document_number: z.string().optional(),
  birth_date: z.string().optional(), gender: z.string().optional(), address: z.string().optional(),
  medical_notes: z.string().optional(), emergency_contact: z.string().optional(), emergency_phone: z.string().optional(),
  guardian_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewStudentPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [guardians, setGuardians] = useState<{ id: string; name: string }[]>([]);
  const [showNewGuardian, setShowNewGuardian] = useState(false);
  const [gFn, setGFn] = useState(""); const [gLn, setGLn] = useState(""); const [gRel, setGRel] = useState("");
  const [gPh, setGPh] = useState(""); const [gEm, setGEm] = useState("");

  useEffect(() => {
    fetch("/api/guardians").then(r => r.json()).then(d => {
      if (d.data?.items) setGuardians(d.data.items.map((g: { id: string; first_name: string; last_name: string }) => ({ id: g.id, name: `${g.last_name}, ${g.first_name}` })));
    });
  }, []);

  async function onSubmit(data: FormData) {
    try {
      let guardianId = data.guardian_id;
      if (!guardianId && gFn && gLn) {
        const gr = await fetch("/api/guardians", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ first_name: gFn, last_name: gLn, relationship: gRel, phone: gPh, email: gEm }) });
        if (gr.ok) { const gd = await gr.json(); guardianId = gd.data.id; }
      }
      const body = { ...data, birth_date: data.birth_date || undefined, guardian_id: undefined };
      const res = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || "Error");
      const student = await res.json();
      if (guardianId && student.data?.id) {
        await fetch("/api/student-guardians", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: student.data.id, guardianId }) });
      }
      router.push("/dashboard/students"); router.refresh();
    } catch (err) { setError("root", { message: err instanceof Error ? err.message : "Error" }); }
  }

  const F = "space-y-2";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/students" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nuevo estudiante</h2></div></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>Datos del estudiante</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name&&<p className="text-xs text-red-600">{errors.first_name.message}</p>}</div><div className={F}><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name&&<p className="text-xs text-red-600">{errors.last_name.message}</p>}</div></div>
          <div className="grid gap-4 sm:grid-cols-3"><div className={F}><Label>Tipo</Label><select {...register("document_type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div><div className={F}><Label>Número</Label><Input {...register("document_number")}/></div><div className={F}><Label>Nacimiento</Label><Input type="date" {...register("birth_date")}/></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Género</Label><select {...register("gender")} className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="M">M</option><option value="F">F</option></select></div><div className={F}><Label>Dirección</Label><Input {...register("address")}/></div></div>
          <div className={F}><Label>Notas médicas</Label><Input {...register("medical_notes")}/></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Contacto emerg.</Label><Input {...register("emergency_contact")}/></div><div className={F}><Label>Tel. emerg.</Label><Input type="tel" {...register("emergency_phone")}/></div></div>
        </CardContent></Card>

        <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Tutor</CardTitle><button type="button" onClick={()=>setShowNewGuardian(!showNewGuardian)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#2563EB] hover:bg-blue-50"><Plus className="h-3 w-3"/>{showNewGuardian?"Seleccionar existente":"Nuevo tutor"}</button></CardHeader><CardContent className="space-y-4">
          {!showNewGuardian ? (
            <div className={F}><Label>Tutor existente</Label><select {...register("guardian_id")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Sin tutor</option>{guardians.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Nombre</Label><Input value={gFn} onChange={e=>setGFn(e.target.value)}/></div><div className={F}><Label>Apellidos</Label><Input value={gLn} onChange={e=>setGLn(e.target.value)}/></div></div>
              <div className="grid gap-4 sm:grid-cols-3"><div className={F}><Label>Parentesco</Label><Input value={gRel} onChange={e=>setGRel(e.target.value)} placeholder="Padre"/></div><div className={F}><Label>Teléfono</Label><Input value={gPh} onChange={e=>setGPh(e.target.value)}/></div><div className={F}><Label>Email</Label><Input type="email" value={gEm} onChange={e=>setGEm(e.target.value)}/></div></div>
            </div>
          )}
        </CardContent></Card>

        {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        <CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/students"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSubmitting}>{isSubmitting?"Guardando...":"Guardar estudiante"}</Button></CardFooter>
      </form>
    </div>
  );
}
