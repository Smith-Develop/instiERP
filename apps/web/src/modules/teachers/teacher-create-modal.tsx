"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";

type Subject = { id: string; name: string };

const schema = z.object({ first_name: z.string().min(1,"Requerido"), last_name: z.string().min(1,"Requerido"), specialties: z.string().optional() });
type FormData = z.infer<typeof schema>;

export function TeacherCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState:{errors,isSubmitting}, setError, reset, setValue } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetch("/api/subjects").then(r=>r.json()).then(d=>{ if(d.data?.items) setSubjects(d.data.items); });
      setSelectedSubjects(new Set());
      reset({});
    }
  }, [open, reset]);

  function toggleSubject(id: string) {
    const next = new Set(selectedSubjects);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSubjects(next);
    const names = [...next].map(sid => subjects.find(s=>s.id===sid)?.name ?? "").filter(Boolean).join(", ");
    setValue("specialties", names);
  }

  const createMut = useMutation({
    mutationFn: async (data: FormData) => {
      const r = await fetch("/api/teachers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error||"Error");
    },
    onSuccess: () => { queryClient.invalidateQueries(); onClose(); reset(); setSelectedSubjects(new Set()); },
    onError: (e:Error) => setError("root",{message:e.message}),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative z-50 w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4"><h2 className="text-lg font-bold text-slate-900">Nuevo profesor</h2><button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button></div>
        <form onSubmit={handleSubmit((d)=>createMut.mutate(d))} className="px-6 py-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name&&<p className="text-xs text-red-600">{errors.first_name.message}</p>}</div>
            <div className="space-y-1.5"><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name&&<p className="text-xs text-red-600">{errors.last_name.message}</p>}</div>
          </div>
          <div className="space-y-1.5">
            <Label>Especialidades</Label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {subjects.length===0?<Loader2 className="h-4 w-4 animate-spin text-slate-400"/>:
                subjects.map(s=>(
                  <button key={s.id} type="button" onClick={()=>toggleSubject(s.id)} className={`inline-flex rounded-md border px-3 py-1 text-xs font-medium transition-colors ${selectedSubjects.has(s.id)?"border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]":"border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{s.name}</button>
                ))
              }
            </div>
            <input type="hidden" {...register("specialties")}/>
          </div>
          {errors.root&&<div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="flex gap-3 border-t pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting?"Creando...":"Crear profesor"}</Button></div>
        </form>
      </div>
    </div>
  );
}
