"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X, Pencil, Trash2, Loader2, User, Users, Phone, Mail } from "lucide-react";
import Link from "next/link";

type GuardianFull = {
  id: string; first_name: string; last_name: string; relationship: string | null; phone: string | null; email: string | null;
};
type StudentLink = { id: string; student: { id: string; first_name: string; last_name: string } };

const editSchema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1),
  relationship: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional().or(z.literal("")),
});
type EditForm = z.infer<typeof editSchema>;

async function fetchGuardian(id: string) { const r = await fetch(`/api/guardians/${id}`); return (await r.json()).data as GuardianFull; }
async function fetchStudents(id: string) { const r = await fetch(`/api/student-guardians?guardianId=${id}`).catch(() => null); if (!r?.ok) return []; const d = await r.json(); return (d.data?.items ?? []) as StudentLink[]; }

type Props = { guardianId: string; open: boolean; onClose: () => void };

export function GuardianProfileModal({ guardianId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: full, isLoading } = useQuery({ queryKey: ["guardian", guardianId], queryFn: () => fetchGuardian(guardianId), enabled: open && !!guardianId });
  const { data: students = [] } = useQuery({ queryKey: ["guardian-students", guardianId], queryFn: () => fetchStudents(guardianId), enabled: open && !!guardianId });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (full) reset({ first_name: full.first_name, last_name: full.last_name, relationship: full.relationship ?? "", phone: full.phone ?? "", email: full.email ?? "" });
  }, [full, reset]);

  async function onSave(data: EditForm) { await fetch(`/api/guardians/${guardianId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); setEditing(false); queryClient.invalidateQueries({ queryKey: ["guardian", guardianId] }); queryClient.invalidateQueries(); }
  async function onDelete() { await fetch(`/api/guardians/${guardianId}`, { method: "DELETE" }); onClose(); queryClient.invalidateQueries(); }

  if (!open) return null;
  const F = "space-y-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-3xl flex flex-col rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden" style={{ height: "80vh", minHeight: "80vh", maxHeight: "80vh" }}>
        <div className="shrink-0 flex items-start justify-between bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] text-white px-8 py-6">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/15 text-white text-3xl font-bold border-2 border-white/30">{full?.first_name?.[0]}{full?.last_name?.[0]}</div>
            <div>
              <h1 className="text-2xl font-bold">{full?.first_name} {full?.last_name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/80">
                {full?.relationship && <span>{full.relationship}</span>}
                {full?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{full.phone}</span>}
                {full?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{full.email}</span>}
              </div>
              <span className="inline-flex rounded-md bg-white/10 px-2 py-0.5 mt-2 text-xs font-medium">{students.length} estudiante{students.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"><Pencil className="h-4 w-4" /> Editar</button>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="rounded-md p-1.5 text-white/60 hover:text-white hover:bg-white/10"><Trash2 className="h-4 w-4" /></button>
                ) : (
                  <div className="flex items-center gap-1"><button onClick={() => setConfirmDelete(false)} className="rounded-md px-2 py-1.5 text-xs font-medium text-white/70">No</button><button onClick={onDelete} disabled={isSubmitting} className="rounded-md bg-red-500 px-2 py-1.5 text-xs font-medium text-white">Sí</button></div>
                )}
              </>
            ) : (
              <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10">Cancelar</button>
            )}
            <button onClick={onClose} className="rounded-md p-1.5 text-white/50 hover:text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {isLoading ? <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div> : full ? (
            <>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="h-4 w-4 text-[#1E3A5F]" /> Datos del Tutor</h3>
                {editing ? (
                  <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Nombre *</Label><Input {...register("first_name")} />{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div><div className={F}><Label>Apellidos *</Label><Input {...register("last_name")} />{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div></div>
                    <div className={F}><Label>Parentesco</Label><Input {...register("relationship")} /></div>
                    <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Teléfono</Label><Input type="tel" {...register("phone")} /></div><div className={F}><Label>Email</Label><Input type="email" {...register("email")} />{errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}</div></div>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar cambios"}</Button>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    {[{ l: "Nombre", v: `${full.first_name} ${full.last_name}` }, { l: "Parentesco", v: full.relationship || "—" }, { l: "Teléfono", v: full.phone || "—" }, { l: "Email", v: full.email || "—" }].map(r => <div key={r.l} className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">{r.l}</span><span className="font-medium text-slate-900">{r.v}</span></div>)}
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-[#1E3A5F]" /> Estudiantes Vinculados</h3>
                {students.length === 0 ? <p className="text-sm text-slate-400">Sin estudiantes vinculados.</p> :
                  <div className="space-y-2">
                    {students.map(s => (
                      <Link key={s.id} href={`/dashboard/students`} className="flex items-center justify-between rounded-md border bg-slate-50 px-5 py-3 hover:border-slate-300 transition-colors">
                        <span className="font-medium text-slate-900">{s.student.last_name}, {s.student.first_name}</span>
                        <span className="text-xs text-[#2563EB]">Ver expediente →</span>
                      </Link>
                    ))}
                  </div>
                }
              </div>
            </>
          ) : null}
        </div>
        <div className="shrink-0 border-t bg-slate-50 px-8 py-3 text-xs text-slate-400 flex items-center justify-between"><span>Tutor #{guardianId?.slice(0, 8)}</span><span>Insti ERP</span></div>
      </div>
    </div>
  );
}
