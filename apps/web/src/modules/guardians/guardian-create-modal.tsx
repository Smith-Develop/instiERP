"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X } from "lucide-react";

const schema = z.object({
  first_name: z.string().min(1,"Requerido"), last_name: z.string().min(1,"Requerido"),
  relationship: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export function GuardianCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState:{errors,isSubmitting}, setError, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMut = useMutation({
    mutationFn: async (data: FormData) => {
      const r = await fetch("/api/guardians",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
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
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4"><h2 className="text-lg font-bold text-slate-900">Nuevo tutor</h2><button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button></div>
        <form onSubmit={handleSubmit((d)=>createMut.mutate(d))} className="px-6 py-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name&&<p className="text-xs text-red-600">{errors.first_name.message}</p>}</div><div className={F}><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name&&<p className="text-xs text-red-600">{errors.last_name.message}</p>}</div></div>
          <div className={F}><Label>Parentesco</Label><Input {...register("relationship")} placeholder="Padre, Madre"/></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Teléfono</Label><Input type="tel" {...register("phone")}/></div><div className={F}><Label>Email</Label><Input type="email" {...register("email")}/>{errors.email&&<p className="text-xs text-red-600">{errors.email.message}</p>}</div></div>
          {errors.root&&<div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="flex gap-3 border-t pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting?"Creando...":"Crear tutor"}</Button></div>
        </form>
      </div>
    </div>
  );
}
