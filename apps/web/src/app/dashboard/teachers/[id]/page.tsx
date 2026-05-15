"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Label } from "@insti/ui";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditTeacherPage() {
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
    specialties: "",
    is_active: true,
  });

  useEffect(() => {
    fetch(`/api/teachers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setForm({
            first_name: d.data.first_name ?? "",
            last_name: d.data.last_name ?? "",
            specialties: d.data.specialties ?? "",
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
      const res = await fetch(`/api/teachers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar");
      }

      router.push("/dashboard/teachers");
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
      await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      router.push("/dashboard/teachers");
      router.refresh();
    } catch {
      setError("Error al eliminar");
      setDeleting(false);
    }
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
          <Link href="/dashboard/teachers" className="rounded-md p-1 text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Editar profesor</h2>
            <p className="text-sm text-slate-500">{form.last_name}, {form.first_name}</p>
          </div>
        </div>
        {!confirmDelete ? (
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Confirmar eliminar"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Datos del profesor</CardTitle>
            <CardDescription>Edita la información y especialidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input id="first_name" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellidos *</Label>
                <Input id="last_name" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Especialidades</Label>
              <Input id="specialties" value={form.specialties} onChange={(e) => setForm((p) => ({ ...p, specialties: e.target.value }))} placeholder="Matemáticas, Física" />
              <p className="text-xs text-slate-400">Separa las especialidades con comas</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
              <Label htmlFor="is_active">Profesor activo</Label>
            </div>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/teachers">
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
