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

const editStudentSchema = z.object({
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  document_type: z.string().optional(),
  document_number: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  medical_notes: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  is_active: z.boolean(),
});

type EditForm = z.infer<typeof editStudentSchema>;

export default function EditStudentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset, watch } = useForm<EditForm>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: { is_active: true, first_name: "", last_name: "" },
  });

  const lastName = watch("last_name");
  const firstName = watch("first_name");

  useEffect(() => {
    fetch(`/api/students/${id}`).then(r => r.json()).then(d => {
      if (d.data) reset({
        first_name: d.data.first_name ?? "", last_name: d.data.last_name ?? "",
        document_type: d.data.document_type ?? "", document_number: d.data.document_number ?? "",
        birth_date: d.data.birth_date?.slice(0, 10) ?? "", gender: d.data.gender ?? "",
        address: d.data.address ?? "", medical_notes: d.data.medical_notes ?? "",
        emergency_contact: d.data.emergency_contact ?? "", emergency_phone: d.data.emergency_phone ?? "",
        is_active: d.data.is_active ?? true,
      });
    }).catch(() => setError("root", { message: "Error al cargar" })).finally(() => setLoading(false));
  }, [id, reset, setError]);

  async function onSubmit(data: EditForm) {
    try {
      const body = { ...data, birth_date: data.birth_date || undefined };
      const res = await fetch(`/api/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error al guardar");
      router.push("/dashboard/students"); router.refresh();
    } catch (err) { setError("root", { message: err instanceof Error ? err.message : "Error" }); }
  }

  async function handleDelete() { setDeleting(true);
    try { await fetch(`/api/students/${id}`, { method: "DELETE" }); router.push("/dashboard/students"); router.refresh(); }
    catch { setError("root", { message: "Error al eliminar" }); setDeleting(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400"/></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/students" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link>
          <div><h2 className="text-2xl font-bold text-slate-900">Editar estudiante</h2><p className="text-sm text-slate-500">{lastName}, {firstName}</p></div>
        </div>
        {!confirmDelete ? <Button variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4"/> Eliminar</Button>
        : <div className="flex items-center gap-2"><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button><Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Eliminando..." : "Confirmar"}</Button></div>}
      </div>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader><CardTitle>Datos del estudiante</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div>
              <div className="space-y-2"><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Documento</Label><select {...register("document_type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div>
              <div className="space-y-2"><Label>Número</Label><Input {...register("document_number")}/></div>
              <div className="space-y-2"><Label>Nacimiento</Label><Input type="date" {...register("birth_date")}/></div>
            </div>
            <div className="space-y-2"><Label>Género</Label><select {...register("gender")} className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="M">M</option><option value="F">F</option><option value="OTRO">Otro</option></select></div>
            <div className="space-y-2"><Label>Dirección</Label><Input {...register("address")}/></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Contacto emergencia</Label><Input {...register("emergency_contact")}/></div><div className="space-y-2"><Label>Tel. emergencia</Label><Input type="tel" {...register("emergency_phone")}/></div></div>
            <div className="space-y-2"><Label>Notas médicas</Label><Input {...register("medical_notes")}/></div>
            <div className="flex items-center gap-3 pt-2"><input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded border-slate-300"/><Label>Estudiante activo</Label></div>
            {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/students"><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar cambios"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
