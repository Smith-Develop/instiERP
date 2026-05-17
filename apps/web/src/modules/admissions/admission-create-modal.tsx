"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X } from "lucide-react";

const schema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1),
  document_type: z.string().optional(), document_number: z.string().optional(),
  birth_date: z.string().optional(), gender: z.string().optional(), address: z.string().optional(),
  desired_grade_id: z.string().optional(), guardian_name: z.string().optional(), guardian_relationship: z.string().optional(),
  guardian_phone: z.string().optional(), guardian_email: z.string().email().optional().or(z.literal("")),
  medical_notes: z.string().optional(), emergency_contact: z.string().optional(), emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function AdmissionCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState:{errors,isSubmitting}, setError, reset } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [grades, setGrades] = useState<{id:string;name:string}[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/academic/sections").then(r=>r.json()).then(d=>{const m=new Map<string,string>();for(const s of (d.data??[]) as {gradeId:string;gradeName:string}[]){if(!m.has(s.gradeId))m.set(s.gradeId,s.gradeName)}setGrades([...m.entries()].map(([id,name])=>({id,name})))});
      reset({});
    }
  }, [open, reset]);

  const createMut = useMutation({
    mutationFn: async (data: FormData) => {
      const r = await fetch("/api/admissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error||"Error");
    },
    onSuccess: () => { queryClient.invalidateQueries(); onClose(); reset(); },
    onError: (e:Error) => setError("root",{message:e.message}),
  });

  if (!open) return null;
  const F = "space-y-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative z-50 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-lg"><h2 className="text-lg font-bold text-slate-900">Nueva admisión</h2><button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button></div>
        <form onSubmit={handleSubmit((d)=>createMut.mutate(d))} className="px-6 py-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Datos del estudiante</h3>
            <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name&&<p className="text-xs text-red-600">{errors.first_name.message}</p>}</div><div className={F}><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name&&<p className="text-xs text-red-600">{errors.last_name.message}</p>}</div></div>
            <div className="grid gap-4 sm:grid-cols-3"><div className={F}><Label>Tipo doc.</Label><select {...register("document_type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div><div className={F}><Label>Número</Label><Input {...register("document_number")}/></div><div className={F}><Label>Nacimiento</Label><Input type="date" {...register("birth_date")}/></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Género</Label><select {...register("gender")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="M">M</option><option value="F">F</option></select></div><div className={F}><Label>Dirección</Label><Input {...register("address")}/></div></div>
            <div className={F}><Label>Grado al que aspira</Label><select {...register("desired_grade_id")} className="flex h-10 w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option>{grades.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Notas médicas</Label><Input {...register("medical_notes")}/></div><div className={F}><Label>Contacto emergencia</Label><Input {...register("emergency_contact")}/></div></div>
            <div className={F}><Label>Tel. emergencia</Label><Input type="tel" {...register("emergency_phone")}/></div>
          </div>
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Datos del tutor</h3>
            <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Nombre tutor</Label><Input {...register("guardian_name")}/></div><div className={F}><Label>Parentesco</Label><Input {...register("guardian_relationship")} placeholder="Padre"/></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Teléfono tutor</Label><Input type="tel" {...register("guardian_phone")}/></div><div className={F}><Label>Email tutor</Label><Input type="email" {...register("guardian_email")}/>{errors.guardian_email&&<p className="text-xs text-red-600">{errors.guardian_email.message}</p>}</div></div>
          </div>
          <div className="space-y-2"><Label>Notas adicionales</Label><Input {...register("notes")}/></div>
          {errors.root&&<div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="flex gap-3 border-t pt-4 sticky bottom-0 bg-white pb-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting?"Creando...":"Crear admisión"}</Button></div>
        </form>
      </div>
    </div>
  );
}
