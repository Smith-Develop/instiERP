"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAdmissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          document_type: form.get("document_type") || undefined,
          document_number: form.get("document_number") || undefined,
          birth_date: form.get("birth_date") || undefined,
          notes: form.get("notes") || undefined,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al crear admisión");
      }

      router.push("/dashboard/admissions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admissions" className="rounded-md p-1 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nueva admisión</h2>
          <p className="text-sm text-slate-500">Registra una preinscripción</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Datos del solicitante</CardTitle>
            <CardDescription>Información para la preinscripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input id="first_name" name="first_name" required placeholder="Ana" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellidos *</Label>
                <Input id="last_name" name="last_name" required placeholder="García" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="document_type">Tipo documento</Label>
                <select id="document_type" name="document_type" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
                  <option value="">Seleccionar</option>
                  <option value="DNI">DNI</option>
                  <option value="NIE">NIE</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_number">Número documento</Label>
                <Input id="document_number" name="document_number" placeholder="12345678A" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha nacimiento</Label>
                <Input id="birth_date" name="birth_date" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" name="notes" placeholder="Observaciones adicionales..." />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/admissions">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar admisión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
