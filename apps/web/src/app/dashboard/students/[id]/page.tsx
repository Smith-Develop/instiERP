"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Label } from "@insti/ui";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    document_type: "",
    document_number: "",
    birth_date: "",
    gender: "",
    address: "",
    medical_notes: "",
    emergency_contact: "",
    emergency_phone: "",
    is_active: true,
  });

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setForm({
            first_name: d.data.first_name ?? "",
            last_name: d.data.last_name ?? "",
            document_type: d.data.document_type ?? "",
            document_number: d.data.document_number ?? "",
            birth_date: d.data.birth_date ? d.data.birth_date.slice(0, 10) : "",
            gender: d.data.gender ?? "",
            address: d.data.address ?? "",
            medical_notes: d.data.medical_notes ?? "",
            emergency_contact: d.data.emergency_contact ?? "",
            emergency_phone: d.data.emergency_phone ?? "",
            is_active: d.data.is_active,
          });
        }
      })
      .catch(() => setError("Error al cargar"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar");
      }

      router.push("/dashboard/students");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/students/${id}`, { method: "DELETE" });
      router.push("/dashboard/students");
      router.refresh();
    } catch {
      setError("Error al eliminar");
      setDeleting(false);
    }
  }

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/students" className="rounded-md p-1 text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Editar estudiante</h2>
            <p className="text-sm text-slate-500">
              {form.last_name}, {form.first_name}
            </p>
          </div>
        </div>
        {!confirmDelete ? (
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Confirmar eliminar"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Datos del estudiante</CardTitle>
            <CardDescription>Edita la información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input id="first_name" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellidos *</Label>
                <Input id="last_name" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="document_type">Tipo documento</Label>
                <select id="document_type" value={form.document_type} onChange={(e) => update("document_type", e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
                  <option value="">Seleccionar</option>
                  <option value="DNI">DNI</option>
                  <option value="NIE">NIE</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_number">Número</Label>
                <Input id="document_number" value={form.document_number} onChange={(e) => update("document_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Nacimiento</Label>
                <Input id="birth_date" type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <select id="gender" value={form.gender} onChange={(e) => update("gender", e.target.value)} className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
                <option value="">No especificado</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <CardTitle className="text-base pt-4">Contacto de emergencia</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Nombre contacto</Label>
                <Input id="emergency_contact" value={form.emergency_contact} onChange={(e) => update("emergency_contact", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Teléfono</Label>
                <Input id="emergency_phone" type="tel" value={form.emergency_phone} onChange={(e) => update("emergency_phone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medical_notes">Notas médicas</Label>
              <Input id="medical_notes" value={form.medical_notes} onChange={(e) => update("medical_notes", e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              <Label htmlFor="is_active">Estudiante activo</Label>
            </div>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/students">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
