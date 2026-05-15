"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter(); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setLoading(true); setError(""); const form=new FormData(e.currentTarget);
    try { const res=await fetch("/api/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:form.get("title"),description:form.get("description")||undefined,start_date:form.get("start_date"),end_date:form.get("end_date")||form.get("start_date"),target:form.get("target")||"TODOS"})}); if(!res.ok) throw new Error("Error"); router.push("/dashboard/calendar"); router.refresh(); }
    catch(err) { setError(err instanceof Error?err.message:"Error"); } finally { setLoading(false); }
  }
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/calendar" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nuevo evento</h2></div></div>
      <Card><form onSubmit={handleSubmit}><CardHeader><CardTitle>Datos del evento</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="title">Título *</Label><Input id="title" name="title" required/></div>
        <div className="space-y-2"><Label htmlFor="description">Descripción</Label><Input id="description" name="description"/></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="start_date">Fecha inicio *</Label><Input id="start_date" name="start_date" type="date" required/></div><div className="space-y-2"><Label htmlFor="end_date">Fecha fin</Label><Input id="end_date" name="end_date" type="date"/></div></div>
        <div className="space-y-2"><Label htmlFor="target">Público</Label><select id="target" name="target" className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="TODOS">Todos</option><option value="PROFESORES">Profesores</option><option value="PADRES">Padres</option><option value="ESTUDIANTES">Estudiantes</option></select></div>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/calendar"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={loading}>{loading?"Creando...":"Crear evento"}</Button></CardFooter></form></Card>
    </div>
  );
}
