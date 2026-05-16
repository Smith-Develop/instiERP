"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const schema = z.object({
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  specialties: z.string().optional(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function EditTeacherPage() {
  const router = useRouter(); const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true); const [deleting, setDeleting] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { is_active: true },
  });

  useEffect(() => {
    fetch(`/api/teachers/${id}`).then(r => r.json()).then(d => {
      if (d.data) reset({ first_name: d.data.first_name ?? "", last_name: d.data.last_name ?? "", specialties: d.data.specialties ?? "", is_active: d.data.is_active ?? true });
    }).catch(() => setError("root", { message: "Error al cargar" })).finally(() => setLoading(false));
  }, [id, reset, setError]);

  async function onSubmit(data: FormData) {
    try { const res = await fetch(`/api/teachers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!res.ok) throw new Error("Error"); router.push("/dashboard/teachers"); router.refresh(); }
    catch (err) { setError("root", { message: err instanceof Error ? err.message : "Error" }); }
  }

  async function handleDelete() { setDeleting(true);
    try { await fetch(`/api/teachers/${id}`, { method: "DELETE" }); router.push("/dashboard/teachers"); router.refresh(); }
    catch { setError("root", { message: "Error" }); setDeleting(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400"/></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Link href="/dashboard/teachers" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Editar profesor</h2></div></div>
        {!confirmDelete ? <Button variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4"/> Eliminar</Button> : <div className="flex items-center gap-2"><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button><Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Eliminando..." : "Confirmar"}</Button></div>}
      </div>
      <Card><form onSubmit={handleSubmit(onSubmit)}><CardHeader><CardTitle>Datos</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div><div className="space-y-2"><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div></div>
        <div className="space-y-2"><Label>Especialidades</Label><Input {...register("specialties")}/></div>
        <div className="flex items-center gap-3"><input type="checkbox" {...register("is_active")} className="h-4 w-4"/><Label>Activo</Label></div>
        {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
      </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/teachers"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar"}</Button></CardFooter></form></Card>
    </div>
  );
}
