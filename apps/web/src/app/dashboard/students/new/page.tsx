"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          document_type: form.get("document_type") || undefined,
          document_number: form.get("document_number") || undefined,
          birth_date: form.get("birth_date") || undefined,
          gender: form.get("gender") || undefined,
          address: form.get("address") || undefined,
          medical_notes: form.get("medical_notes") || undefined,
          emergency_contact: form.get("emergency_contact") || undefined,
          emergency_phone: form.get("emergency_phone") || undefined,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al crear estudiante");
      }

      router.push("/dashboard/students");
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
        <Link href="/dashboard/students" className="rounded-md p-1 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nuevo estudiante</h2>
          <p className="text-sm text-slate-500">Registra un nuevo alumno en el sistema</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Datos del estudiante</CardTitle>
            <CardDescription>Información personal y de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input id="first_name" name="first_name" required placeholder="Ana" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellidos *</Label>
                <Input id="last_name" name="last_name" required placeholder="García López" />
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
              <Label htmlFor="gender">Género</Label>
              <select id="gender" name="gender" className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
                <option value="">No especificado</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" placeholder="Calle Mayor 123, 28001 Madrid" />
            </div>

            <CardTitle className="text-base pt-4">Contacto de emergencia</CardTitle>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Nombre contacto</Label>
                <Input id="emergency_contact" name="emergency_contact" placeholder="María García" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Teléfono contacto</Label>
                <Input id="emergency_phone" name="emergency_phone" type="tel" placeholder="+34 600 000 000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_notes">Notas médicas</Label>
              <Input id="medical_notes" name="medical_notes" placeholder="Alergias, medicación, etc." />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/students">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar estudiante"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
