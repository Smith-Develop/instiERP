"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewSubjectPage() {
  const router = useRouter(); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setLoading(true); setError(""); const form=new FormData(e.currentTarget);
    try { const res=await fetch("/api/subjects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),code:form.get("code")||undefined,description:form.get("description")||undefined})}); if(!res.ok) throw new Error("Error"); router.push("/dashboard/subjects"); router.refresh(); }
    catch(err) { setError(err instanceof Error?err.message:"Error"); } finally { setLoading(false); }
  }
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/subjects" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nueva asignatura</h2></div></div>
      <Card><form onSubmit={handleSubmit}><CardHeader><CardTitle>Datos</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="name">Nombre *</Label><Input id="name" name="name" required/></div>
        <div className="space-y-2"><Label htmlFor="code">Código</Label><Input id="code" name="code" placeholder="MAT"/></div>
        <div className="space-y-2"><Label htmlFor="desc">Descripción</Label><Input id="desc" name="description"/></div>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/subjects"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={loading}>{loading?"Guardando...":"Guardar"}</Button></CardFooter></form></Card>
    </div>
  );
}
