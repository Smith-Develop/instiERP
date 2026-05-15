"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewGuardianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/guardians", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || "Error"); }
      router.push("/dashboard/guardians"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/guardians" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link>
        <div><h2 className="text-2xl font-bold text-slate-900">Nuevo tutor</h2><p className="text-sm text-slate-500">Registra un padre o tutor legal</p></div>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle>Datos del tutor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="first_name">Nombre *</Label><Input id="first_name" name="first_name" required/></div>
              <div className="space-y-2"><Label htmlFor="last_name">Apellidos *</Label><Input id="last_name" name="last_name" required/></div>
            </div>
            <div className="space-y-2"><Label htmlFor="relationship">Parentesco</Label><Input id="relationship" name="relationship" placeholder="Padre, Madre, Tutor legal"/></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="phone">Teléfono</Label><Input id="phone" name="phone" type="tel"/></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email"/></div>
            </div>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/guardians"><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
