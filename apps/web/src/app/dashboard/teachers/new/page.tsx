"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const schema = z.object({
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  specialties: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewTeacherPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Error"); }
      router.push("/dashboard/teachers"); router.refresh();
    } catch (err) { setError("root", { message: err instanceof Error ? err.message : "Error" }); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/teachers" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nuevo profesor</h2></div></div>
      <Card><form onSubmit={handleSubmit(onSubmit)}><CardHeader><CardTitle>Datos</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div><div className="space-y-2"><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div></div>
        <div className="space-y-2"><Label>Especialidades</Label><Input {...register("specialties")} placeholder="Matemáticas, Física"/></div>
        {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
      </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/teachers"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar"}</Button></CardFooter></form></Card>
    </div>
  );
}
