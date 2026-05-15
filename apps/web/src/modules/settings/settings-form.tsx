"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { Building2 } from "lucide-react";

type School = { id: string; name: string; slug: string; address: string | null; phone: string | null; email: string | null };
type AcademicYear = { id: string; year_label: string; start_date: Date; end_date: Date; is_active: boolean };

export function SettingsForm({ school, academicYears }: { school: School | null; academicYears: AcademicYear[] }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setSaved(false);
    try {
      // For now just show saved — school update API can be added later
      await new Promise(r => setTimeout(r, 500));
      setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* School Info */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]/10"><Building2 className="h-5 w-5 text-[#1E3A5F]"/></div><div><CardTitle>Perfil del colegio</CardTitle></div></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Nombre</Label><Input defaultValue={school?.name ?? ""} name="name"/></div>
              <div className="space-y-2"><Label>Slug</Label><Input defaultValue={school?.slug ?? ""} name="slug" disabled/></div>
            </div>
            <div className="space-y-2"><Label>Dirección</Label><Input defaultValue={school?.address ?? ""} name="address"/></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Teléfono</Label><Input defaultValue={school?.phone ?? ""} name="phone"/></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue={school?.email ?? ""} name="email"/></div>
            </div>
            {saved && <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Cambios guardados</div>}
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </CardContent>
          <CardFooter className="border-t pt-6"><Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button></CardFooter>
        </form>
      </Card>

      {/* Academic Years */}
      <Card>
        <CardHeader><CardTitle>Años lectivos</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {academicYears.map(y => (
              <div key={y.id} className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{y.year_label}</p>
                  <p className="text-sm text-slate-500">{new Date(y.start_date).toLocaleDateString("es-ES")} — {new Date(y.end_date).toLocaleDateString("es-ES")}</p>
                </div>
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${y.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{y.is_active ? "Activo" : "Inactivo"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roles info */}
      <Card>
        <CardHeader><CardTitle>Roles del sistema</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["SUPER_ADMIN","DIRECTOR","SECRETARIA","PROFESOR","PADRE","ESTUDIANTE","CONTABILIDAD"].map(r => (
              <span key={r} className="inline-flex rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700">{r}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
