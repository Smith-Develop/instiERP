"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X, Plus } from "lucide-react";

const schema = z.object({
  first_name: z.string().min(1, "Requerido"), last_name: z.string().min(1, "Requerido"),
  document_type: z.string().optional(), document_number: z.string().optional(),
  birth_date: z.string().optional(), gender: z.string().optional(), address: z.string().optional(),
  medical_notes: z.string().optional(), emergency_contact: z.string().optional(), emergency_phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = { open: boolean; onClose: () => void };

export function StudentCreateModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [guardians, setGuardians] = useState<{ id: string; name: string }[]>([]);
  const [showNewGuardian, setShowNewGuardian] = useState(false);
  const [gFn, setGFn] = useState(""); const [gLn, setGLn] = useState("");
  const [gRel, setGRel] = useState(""); const [gPh, setGPh] = useState(""); const [gEm, setGEm] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/guardians").then(r => r.json()).then(d => {
        if (d.data?.items) setGuardians(d.data.items.map((g: { id: string; first_name: string; last_name: string }) => ({ id: g.id, name: `${g.last_name}, ${g.first_name}` })));
      });
      reset({});
    }
  }, [open, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let guardianId: string | undefined;
      if (gFn && gLn) {
        const gr = await fetch("/api/guardians", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ first_name: gFn, last_name: gLn, relationship: gRel, phone: gPh, email: gEm }) });
        if (gr.ok) { const gd = await gr.json(); guardianId = gd.data.id; }
      }
      const res = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, birth_date: data.birth_date || undefined }) });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || "Error");
      const student = await res.json();
      if (guardianId && student.data?.id) {
        await fetch("/api/student-guardians", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: student.data.id, guardianId }) });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); onClose(); setGFn(""); setGLn(""); setGRel(""); setGPh(""); setGEm(""); setShowNewGuardian(false); },
    onError: (e: Error) => setError("root", { message: e.message }),
  });

  if (!open) return null;

  const F = "space-y-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-lg">
          <h2 className="text-lg font-bold text-slate-900">Nuevo estudiante</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
        </div>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="px-6 py-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Datos del estudiante</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={F}><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div>
              <div className={F}><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={F}><Label>Tipo doc.</Label><select {...register("document_type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div>
              <div className={F}><Label>Número</Label><Input {...register("document_number")}/></div>
              <div className={F}><Label>Nacimiento</Label><Input type="date" {...register("birth_date")}/></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={F}><Label>Género</Label><select {...register("gender")} className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="M">M</option><option value="F">F</option></select></div>
              <div className={F}><Label>Dirección</Label><Input {...register("address")}/></div>
            </div>
            <div className={F}><Label>Notas médicas</Label><Input {...register("medical_notes")}/></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={F}><Label>Contacto emerg.</Label><Input {...register("emergency_contact")}/></div>
              <div className={F}><Label>Tel. emerg.</Label><Input type="tel" {...register("emergency_phone")}/></div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Tutor</h3>
              <button type="button" onClick={() => setShowNewGuardian(!showNewGuardian)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#2563EB] hover:bg-blue-50"><Plus className="h-3 w-3"/>{showNewGuardian ? "Seleccionar existente" : "Nuevo tutor"}</button>
            </div>
            {!showNewGuardian ? (
              <div className={F}><Label>Tutor existente</Label><select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Sin tutor</option>{guardians.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Nombre</Label><Input value={gFn} onChange={e => setGFn(e.target.value)}/></div><div className={F}><Label>Apellidos</Label><Input value={gLn} onChange={e => setGLn(e.target.value)}/></div></div>
                <div className="grid gap-4 sm:grid-cols-3"><div className={F}><Label>Parentesco</Label><Input value={gRel} onChange={e => setGRel(e.target.value)} placeholder="Padre"/></div><div className={F}><Label>Teléfono</Label><Input value={gPh} onChange={e => setGPh(e.target.value)}/></div><div className={F}><Label>Email</Label><Input type="email" value={gEm} onChange={e => setGEm(e.target.value)}/></div></div>
              </div>
            )}
          </div>

          {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}

          <div className="flex gap-3 border-t pt-4 sticky bottom-0 bg-white pb-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Crear estudiante"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
