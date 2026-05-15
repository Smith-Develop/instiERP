"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewInvoicePage() {
  const router = useRouter(); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const [students,setStudents]=useState<{id:string;name:string}[]>([]);

  useEffect(()=>{fetch("/api/students").then(r=>r.json()).then(d=>{if(d.data?.items) setStudents(d.data.items.map((s:{id:string;first_name:string;last_name:string})=>({id:s.id,name:`${s.last_name}, ${s.first_name}`})))})},[]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setLoading(true); setError(""); const form=new FormData(e.currentTarget);
    try { const res=await fetch("/api/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({student_id:form.get("student_id"),concept:form.get("concept"),amount:Number(form.get("amount")),due_date:form.get("due_date")||undefined,academic_year_id:"00000000-0000-0000-0000-000000000002"})}); if(!res.ok) throw new Error("Error"); router.push("/dashboard/finance"); router.refresh(); }
    catch(err) { setError(err instanceof Error?err.message:"Error"); } finally { setLoading(false); }
  }
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/finance" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link><div><h2 className="text-2xl font-bold text-slate-900">Nueva factura</h2></div></div>
      <Card><form onSubmit={handleSubmit}><CardHeader><CardTitle>Datos de facturación</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="student_id">Estudiante *</Label><select id="student_id" name="student_id" required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">Seleccionar</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="concept">Concepto *</Label><Input id="concept" name="concept" required placeholder="Matrícula, Mensualidad, Comedor..."/></div>
        <div className="space-y-2"><Label htmlFor="amount">Importe (€) *</Label><Input id="amount" name="amount" type="number" step="0.01" min="0" required/></div>
        <div className="space-y-2"><Label htmlFor="due_date">Vencimiento</Label><Input id="due_date" name="due_date" type="date"/></div>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </CardContent><CardFooter className="flex gap-3 border-t pt-6"><Link href="/dashboard/finance"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={loading}>{loading?"Creando...":"Crear factura"}</Button></CardFooter></form></Card>
    </div>
  );
}
