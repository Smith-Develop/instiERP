"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { Plus, Trash2, Pencil, Loader2, X } from "lucide-react";

type AcademicYear = { id: string; year_label: string; start_date: string; end_date: string; is_active: boolean };

export function YearsManager() {
  const queryClient = useQueryClient();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [yearLabel, setYearLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/academic/years")
      .then(r => r.json())
      .then(d => { if (d.data?.items) setYears(d.data.items); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setYearLabel("");
    setStartDate("");
    setEndDate("");
    setIsActive(false);
    setShowForm(true);
    setError("");
  }

  function openEdit(y: AcademicYear) {
    setEditId(y.id);
    setYearLabel(y.year_label);
    setStartDate(y.start_date?.slice(0, 10) ?? "");
    setEndDate(y.end_date?.slice(0, 10) ?? "");
    setIsActive(y.is_active);
    setShowForm(true);
    setError("");
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const url = editId ? `/api/academic/years/${editId}` : "/api/academic/years";
      const method = editId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year_label: yearLabel, start_date: startDate, end_date: endDate, is_active: isActive }) });
      if (!r.ok) throw new Error((await r.json().catch(()=>({}))).error || "Error");
    },
    onSuccess: () => { setShowForm(false); load(); queryClient.invalidateQueries(); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/academic/years/${id}`, { method: "DELETE" }); },
    onSuccess: () => { load(); queryClient.invalidateQueries(); },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Años lectivos</CardTitle>
          {!showForm && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4"/> Nuevo año</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Etiqueta *</Label><Input value={yearLabel} onChange={e => setYearLabel(e.target.value)} placeholder="2026-2027" /></div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4"/> <span className="text-sm text-slate-700">Activo</span></label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Inicio *</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Fin *</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveMut.mutate()} disabled={!yearLabel || !startDate || !endDate || saveMut.isPending}>{saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : editId ? "Actualizar" : "Crear"}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="h-4 w-4"/></Button>
            </div>
          </div>
        )}
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : (
          <div className="space-y-2">
            {years.length === 0 ? (
              <p className="text-sm text-slate-400">No hay años lectivos configurados.</p>
            ) : (
              years.map(y => (
                <div key={y.id} className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{y.year_label}</p>
                    <p className="text-xs text-slate-500">{new Date(y.start_date).toLocaleDateString("es-ES")} — {new Date(y.end_date).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${y.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{y.is_active ? "Activo" : "Inactivo"}</span>
                    <button onClick={() => openEdit(y)} className="rounded p-1 text-slate-400 hover:text-[#2563EB]"><Pencil className="h-4 w-4"/></button>
                    <button onClick={() => { if (confirm(`¿Eliminar "${y.year_label}"?`)) deleteMut.mutate(y.id); }} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
