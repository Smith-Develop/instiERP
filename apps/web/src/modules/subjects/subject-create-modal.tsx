"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X } from "lucide-react";

const schema = z.object({ name: z.string().min(1,"Requerido"), code: z.string().optional(), description: z.string().optional() });
type FormData = z.infer<typeof schema>;

export function SubjectCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState:{errors,isSubmitting}, setError, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMut = useMutation({
    mutationFn: async (data: FormData) => {
      const r = await fetch("/api/subjects", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
      if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error||"Error");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subjects"] }); onClose(); reset(); },
    onError: (e:Error) => setError("root",{message:e.message}),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4"><h2 className="text-lg font-bold text-slate-900">Nueva asignatura</h2><button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button></div>
        <form onSubmit={handleSubmit((d)=>createMut.mutate(d))} className="px-6 py-4 space-y-4">
          <div className="space-y-1.5"><Label>Nombre *</Label><Input {...register("name")}/>{errors.name&&<p className="text-xs text-red-600">{errors.name.message}</p>}</div>
          <div className="space-y-1.5"><Label>Código</Label><Input {...register("code")} placeholder="MAT"/></div>
          <div className="space-y-1.5"><Label>Descripción</Label><Input {...register("description")}/></div>
          {errors.root&&<div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="flex gap-3 border-t pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting?"Creando...":"Crear asignatura"}</Button></div>
        </form>
      </div>
    </div>
  );
}
