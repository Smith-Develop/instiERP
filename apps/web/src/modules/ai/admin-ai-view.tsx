"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { Brain, Trash2, Plus, Check, Settings } from "lucide-react";
import Link from "next/link";

type Provider = { id: string; name: string; api_key: string; models: unknown; is_default: boolean; is_active: boolean };
type SchoolWithConfig = { id: string; name: string; config: { provider: { name: string }; model: string; tokens_used: number; max_tokens_per_month: number } | null };

export function AdminAIView({ providers, schools }: { providers: Provider[]; schools: SchoolWithConfig[] }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState(""); const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState(""); const [isDefault, setIsDefault] = useState(false);

  const createMut = useMutation({
    mutationFn: async () => {
      const modelsArr = models.split(",").map(m => m.trim()).filter(Boolean);
      const res = await fetch("/api/ai/providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, api_key: apiKey, models: modelsArr, is_default: isDefault }) });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => { queryClient.invalidateQueries(); setShowAdd(false); setName(""); setApiKey(""); setModels(""); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => fetch(`/api/ai/providers/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const setDefaultMut = useMutation({
    mutationFn: async ({ id, isDefault }: { id: string; isDefault: boolean }) => {
      await fetch(`/api/ai/providers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_default: isDefault }) });
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">IA — Administración</h2><p className="text-sm text-slate-500">{providers.length} proveedores · {schools.length} instituciones</p></div>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4"/> {showAdd ? "Cancelar" : "Añadir proveedor"}</Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle className="text-base">Nuevo proveedor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="gemini"/></div>
              <div className="space-y-2"><Label>API Key</Label><Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}/></div>
              <div className="space-y-2"><Label>Modelos (coma)</Label><Input value={models} onChange={e => setModels(e.target.value)} placeholder="gemini-2.0-flash,gemini-pro"/></div>
            </div>
            <div className="flex items-center gap-3"><input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)}/><Label>Proveedor por defecto</Label></div>
            <Button onClick={() => createMut.mutate()} disabled={!name || !apiKey || createMut.isPending}>{createMut.isPending ? "Creando..." : "Crear proveedor"}</Button>
          </CardContent>
        </Card>
      )}

      {/* Providers list */}
      <div className="space-y-3">
        {providers.map(p => {
          const modelsArr = (p.models as string[]) ?? [];
          return (
            <Card key={p.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600"/>
                  <CardTitle className="text-base capitalize">{p.name}</CardTitle>
                  {p.is_default && <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Default</span>}
                  {!p.is_active && <span className="inline-flex rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Inactivo</span>}
                </div>
                <div className="flex items-center gap-1">
                  {!p.is_default && <button onClick={() => setDefaultMut.mutate({ id: p.id, isDefault: true })} className="rounded p-1 text-slate-400 hover:text-amber-600" title="Marcar default"><Check className="h-4 w-4"/></button>}
                  <button onClick={() => deleteMut.mutate(p.id)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400">Key: {p.api_key.slice(0,8)}... · Modelos: {modelsArr.join(", ") || "—"}</p>
              </CardContent>
            </Card>
          );
        })}
        {providers.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Sin proveedores configurados. Añade Gemini o DeepSeek.</p>}
      </div>

      {/* Institutions config */}
      <Card>
        <CardHeader><CardTitle>Configuración por Institución</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200">
            <table className="w-full">
              <thead><tr className="border-b bg-slate-50">{["Institución","Proveedor","Modelo","Tokens","Límite","Acción"].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
              <tbody>
                {schools.map(s => (
                  <tr key={s.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 text-sm font-medium">{s.name}</td>
                    <td className="p-4 text-sm text-slate-500">{s.config?.provider?.name ?? "—"}</td>
                    <td className="p-4 text-sm text-slate-500">{s.config?.model ?? "—"}</td>
                    <td className="p-4 text-sm text-slate-500">{s.config?.tokens_used ?? 0}</td>
                    <td className="p-4 text-sm text-slate-500">{s.config?.max_tokens_per_month?.toLocaleString() ?? "—"}</td>
                    <td className="p-4"><Link href={`/dashboard/admin/ai/${s.id}`} className="text-sm text-[#2563EB] hover:underline"><Settings className="inline h-4 w-4"/> Configurar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
