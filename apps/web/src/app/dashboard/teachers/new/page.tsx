"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          specialties: form.get("specialties") || undefined,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al crear profesor");
      }

      router.push("/dashboard/teachers");
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
        <Link href="/dashboard/teachers" className="rounded-md p-1 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nuevo profesor</h2>
          <p className="text-sm text-slate-500">Registra un nuevo docente</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Datos del profesor</CardTitle>
            <CardDescription>Información personal y especialidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input id="first_name" name="first_name" required placeholder="Carlos" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellidos *</Label>
                <Input id="last_name" name="last_name" required placeholder="Pérez" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Especialidades</Label>
              <Input id="specialties" name="specialties" placeholder="Matemáticas, Física" />
              <p className="text-xs text-slate-400">Separa las especialidades con comas</p>
            </div>
            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/teachers">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar profesor"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
