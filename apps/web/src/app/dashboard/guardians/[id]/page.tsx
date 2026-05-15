"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditGuardianPage() {
  const router = useRouter(); const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [deleting, setDeleting] = useState(false); const [error, setError] = useState(""); const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", relationship: "", phone: "", email: "" });

  useEffect(() => {
    fetch(`/api/guardians/${id}`).then(r=>r.json()).then(d=>{ if(d.data) setForm({first_name:d.data.first_name??"",last_name:d.data.last_name??"",relationship:d.data.relationship??"",phone:d.data.phone??"",email:d.data.email??""}); }).catch(()=>setError("Error al cargar")).finally(()=>setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSaving(true);
    try {
      const r=await fetch(`/api/guardians/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if(!r.ok) throw new Error("Error al guardar");
      router.push("/dashboard/guardians"); router.refresh();
    } catch(err) { setError(err instanceof Error?err.message:"Error"); } finally { setSaving(false); }
  }

  async function handleDelete() { setDeleting(true);
    try { await fetch(`/api/guardians/${id}`,{method:"DELETE"}); router.push("/dashboard/guardians"); router.refresh(); } catch { setError("Error al eliminar"); setDeleting(false); }
  }

  if(loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400"/></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/guardians" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link>
          <div><h2 className="text-2xl font-bold text-slate-900">Editar tutor</h2><p className="text-sm text-slate-500">{form.last_name}, {form.first_name}</p></div>
        </div>
        {!confirmDelete ? <Button variant="destructive" onClick={()=>setConfirmDelete(true)}><Trash2 className="h-4 w-4"/> Eliminar</Button>
        : <div className="flex items-center gap-2"><Button variant="ghost" onClick={()=>setConfirmDelete(false)}>Cancelar</Button><Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting?"Eliminando...":"Confirmar"}</Button></div>}
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle>Datos del tutor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="fn">Nombre *</Label><Input id="fn" value={form.first_name} onChange={e=>setForm(p=>({...p,first_name:e.target.value}))} required/></div>
              <div className="space-y-2"><Label htmlFor="ln">Apellidos *</Label><Input id="ln" value={form.last_name} onChange={e=>setForm(p=>({...p,last_name:e.target.value}))} required/></div>
            </div>
            <div className="space-y-2"><Label htmlFor="rel">Parentesco</Label><Input id="rel" value={form.relationship} onChange={e=>setForm(p=>({...p,relationship:e.target.value}))}/></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="ph">Teléfono</Label><Input id="ph" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
              <div className="space-y-2"><Label htmlFor="em">Email</Label><Input id="em" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
            </div>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/guardians"><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" disabled={saving}>{saving?"Guardando...":"Guardar cambios"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
