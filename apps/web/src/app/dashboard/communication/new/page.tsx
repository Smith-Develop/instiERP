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
  title: z.string().min(1, "Requerido"),
  content: z.string().min(1, "Requerido"),
  target: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try { const res = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!res.ok) throw new Error("Error"); router.push("/dashboard/communication"); router.refresh(); }
    catch (err) { setError("root", { message: err instanceof Error ? err.message : "Error" }); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/communication" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nuevo anuncio</h2></div></div>
      <Card><form onSubmit={handleSubmit(onSubmit)}><CardHeader><CardTitle>Redactar</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><Label>Título *</Label><Input {...register("title")}/>{errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}</div>
        <div className="space-y-2"><Label>Contenido *</Label><textarea {...register("content")} rows={4} className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"/>{errors.content && <p className="text-xs text-red-600">{errors.content.message}</p>}</div>
        <div className="space-y-2"><Label>Público</Label><select {...register("target")} className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="TODOS">Todos</option><option value="PROFESORES">Profesores</option><option value="PADRES">Padres</option><option value="ESTUDIANTES">Estudiantes</option></select></div>
        {errors.root && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
      </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/communication"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Publicando..." : "Publicar"}</Button></CardFooter></form></Card>
    </div>
  );
}
