"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";

type SubjectFull = { id: string; name: string; code: string | null; description: string | null };

const schema = z.object({ name: z.string().min(1), code: z.string().optional(), description: z.string().optional() });
type EditForm = z.infer<typeof schema>;

export function SubjectProfileModal({ subjectId, open, onClose }: { subjectId: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: subject, isLoading } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: async () => { const r = await fetch(`/api/subjects/${subjectId}`); return ((await r.json()).data) as SubjectFull; },
    enabled: open && !!subjectId,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditForm>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (subject) reset({ name: subject.name, code: subject.code ?? "", description: subject.description ?? "" });
  }, [subject, reset]);

  const updateMut = useMutation({
    mutationFn: async (data: EditForm) => { await fetch(`/api/subjects/${subjectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); },
    onSuccess: () => { setEditing(false); queryClient.invalidateQueries({ queryKey: ["subject", subjectId] }); queryClient.invalidateQueries({ queryKey: ["subjects"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: async () => { await fetch(`/api/subjects/${subjectId}`, { method: "DELETE" }); },
    onSuccess: () => { onClose(); queryClient.invalidateQueries({ queryKey: ["subjects"] }); },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center gap-3"><BookOpen className="h-5 w-5"/><h2 className="text-lg font-bold">{subject?.name ?? "Asignatura"}</h2></div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button onClick={()=>setEditing(true)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"><Pencil className="h-4 w-4"/> Editar</button>
                {!confirmDelete ? (
                  <button onClick={()=>setConfirmDelete(true)} className="rounded-md p-1.5 text-white/60 hover:text-white hover:bg-white/10"><Trash2 className="h-4 w-4"/></button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={()=>setConfirmDelete(false)} className="rounded-md px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10">No</button>
                    <button onClick={()=>deleteMut.mutate()} disabled={deleteMut.isPending} className="rounded-md bg-red-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-600">{deleteMut.isPending?"...":"Sí"}</button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={()=>setEditing(false)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10">Cancelar</button>
            )}
            <button onClick={onClose} className="rounded-md p-1.5 text-white/50 hover:text-white hover:bg-white/10"><X className="h-5 w-5"/></button>
          </div>
        </div>
        <div className="px-6 py-6">
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400"/></div> : subject ? (
            editing ? (
              <form onSubmit={handleSubmit((d)=>updateMut.mutate(d))} className="space-y-4">
                <div className="space-y-1.5"><Label>Nombre *</Label><Input {...register("name")}/>{errors.name&&<p className="text-xs text-red-600">{errors.name.message}</p>}</div>
                <div className="space-y-1.5"><Label>Código</Label><Input {...register("code")}/></div>
                <div className="space-y-1.5"><Label>Descripción</Label><Input {...register("description")}/></div>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting?"Guardando...":"Guardar cambios"}</Button>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[{l:"Nombre",v:subject.name},{l:"Código",v:subject.code||"—"},{l:"Descripción",v:subject.description||"—"}].map(r=><div key={r.l} className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">{r.l}</span><span className="font-medium text-slate-900">{r.v}</span></div>)}
              </div>
            )
          ) : <p className="text-sm text-red-600">Error al cargar</p>}
        </div>
      </div>
    </div>
  );
}
