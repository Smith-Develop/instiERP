"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X } from "lucide-react";

const schema = z.object({ name: z.string().min(1, "Requerido"), capacity: z.coerce.number().min(1).optional() });
type FormData = z.infer<typeof schema>;

export function AcademicSectionModal({ open, onClose, gradeId, editId, editName, editCapacity }: { open: boolean; onClose: () => void; gradeId: string; editId?: string; editName?: string; editCapacity?: number }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: editName ?? "", capacity: editCapacity ?? 30 },
  });

  const mut = useMutation({
    mutationFn: async (data: FormData) => {
      const url = editId ? `/api/academic/sections/${editId}` : "/api/academic/sections";
      const method = editId ? "PUT" : "POST";
      const body = editId ? data : { ...data, grade_id: gradeId };
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
        <div className="flex items-center justify-between border-b px-6 py-4"><h2 className="text-lg font-bold text-slate-900">{editId ? "Editar sección" : "Nueva sección"}</h2><button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleSubmit(d => mut.mutate(d))} className="px-6 py-4 space-y-4">
          <div className="space-y-1.5"><Label>Nombre *</Label><Input {...register("name")} placeholder="A, B, C..." />{errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}</div>
          <div className="space-y-1.5"><Label>Cupo</Label><Input type="number" {...register("capacity")} />{errors.capacity && <p className="text-xs text-red-600">{errors.capacity.message}</p>}</div>
          {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
          <div className="flex gap-3 border-t pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : editId ? "Actualizar" : "Crear"}</Button></div>
        </form>
      </div>
    </div>
  );
}
