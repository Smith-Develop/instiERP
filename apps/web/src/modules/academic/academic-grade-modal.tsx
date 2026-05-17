"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X } from "lucide-react";

const schema = z.object({ name: z.string().min(1, "Requerido") });
type FormData = z.infer<typeof schema>;

export function AcademicGradeModal({ open, onClose, academicLevelId, editId, editName }: { open: boolean; onClose: () => void; academicLevelId: string; editId?: string; editName?: string }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: editName ?? "" } });

  const mut = useMutation({
    mutationFn: async (data: FormData) => {
      const url = editId ? `/api/academic/grades/${editId}` : "/api/academic/grades";
      const method = editId ? "PUT" : "POST";
      const body = editId ? data : { ...data, academic_level_id: academicLevelId };
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json().catch(()=>({}))).error || "Error");
    },
    onSuccess: () => { queryClient.invalidateQueries(); onClose(); reset(); },
    onError: (e: Error) => setError("root", { message: e.message }),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-sm rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4"><h2 className="text-lg font-bold text-slate-900">{editId ? "Editar grado" : "Nuevo grado"}</h2><button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleSubmit(d => mut.mutate(d))} className="px-6 py-4 space-y-4">
          <div className="space-y-1.5"><Label>Nombre *</Label><Input {...register("name")} placeholder="1°, 2°, 3°..." />{errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}</div>
          {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
          <div className="flex gap-3 border-t pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : editId ? "Actualizar" : "Crear"}</Button></div>
        </form>
      </div>
    </div>
  );
}
