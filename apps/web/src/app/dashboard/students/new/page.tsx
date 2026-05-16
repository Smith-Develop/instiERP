"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { studentSchema, type StudentInput } from "@/modules/students/schemas";

export default function NewStudentPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
  });

  async function onSubmit(data: StudentInput) {
    try {
      const body = { ...data, birth_date: data.birth_date || undefined };
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al crear");
      }
      router.push("/dashboard/students");
      router.refresh();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Error" });
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/students" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link>
        <div><h2 className="text-2xl font-bold text-slate-900">Nuevo estudiante</h2><p className="text-sm text-slate-500">Registra un nuevo alumno</p></div>
      </div>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader><CardTitle>Datos del estudiante</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="fn">Nombre *</Label><Input id="fn" {...register("first_name")}/>{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="ln">Apellidos *</Label><Input id="ln" {...register("last_name")}/>{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dt">Tipo documento</Label>
                <select id="dt" {...register("document_type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
                  <option value="">Seleccionar</option><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="space-y-2"><Label htmlFor="dn">Número doc.</Label><Input id="dn" {...register("document_number")}/></div>
              <div className="space-y-2"><Label htmlFor="bd">Nacimiento</Label><Input id="bd" type="date" {...register("birth_date")}/></div>
            </div>
            <div className="space-y-2"><Label htmlFor="g">Género</Label><select id="g" {...register("gender")} className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">No especificado</option><option value="M">Masculino</option><option value="F">Femenino</option><option value="OTRO">Otro</option></select></div>
            <div className="space-y-2"><Label htmlFor="addr">Dirección</Label><Input id="addr" {...register("address")}/></div>
            <CardTitle className="text-base pt-4">Contacto de emergencia</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="ec">Nombre contacto</Label><Input id="ec" {...register("emergency_contact")}/></div>
              <div className="space-y-2"><Label htmlFor="ep">Teléfono</Label><Input id="ep" type="tel" {...register("emergency_phone")}/></div>
            </div>
            <div className="space-y-2"><Label htmlFor="mn">Notas médicas</Label><Input id="mn" {...register("medical_notes")}/></div>
            {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/students"><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar estudiante"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
