"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

type Provider = { id: string; name: string; models: unknown };

export default function SchoolAIConfigPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState("");
  const [model, setModel] = useState("gemini-2.0-flash");
  const [riskThreshold, setRiskThreshold] = useState("0.70");
  const [maxTokens, setMaxTokens] = useState("100000");
  const [chatDataAccess, setChatDataAccess] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/ai/config/${schoolId}`).then(r => r.json()).then(d => {
      if (d.data) {
        setProviders(d.data.providers ?? []);
        if (d.data.config) {
          const c = d.data.config;
          setProviderId(c.provider_id); setModel(c.model); setRiskThreshold(String(c.risk_threshold ?? 0.70));
          setMaxTokens(String(c.max_tokens_per_month ?? 100000)); setChatDataAccess(c.chat_data_access ?? false);
          setSystemPrompt(c.system_prompt ?? "");
        }
      }
    }).finally(() => setLoading(false));
  }, [schoolId]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { provider_id: providerId, model, risk_threshold: Number(riskThreshold), max_tokens_per_month: Number(maxTokens), chat_data_access: chatDataAccess, system_prompt: systemPrompt || null, features: { predictions: true }, is_active: true };
      const res = await fetch(`/api/ai/config/${schoolId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
    onError: (e: Error) => setError(e.message),
  });

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400"/></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/ai" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link>
        <div><h2 className="text-2xl font-bold text-slate-900">Configuración IA</h2><p className="text-sm text-slate-500">Institución #{schoolId?.slice(0,8)}</p></div>
      </div>

      <Card>
        <CardHeader><CardTitle>Proveedor y Modelo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Proveedor</Label>
            <select value={providerId} onChange={e => setProviderId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
              <option value="">Seleccionar</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Modelo</Label><Input value={model} onChange={e => setModel(e.target.value)} placeholder="gemini-2.0-flash"/></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Umbral y Límites</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Umbral de riesgo (0-1)</Label><Input value={riskThreshold} onChange={e => setRiskThreshold(e.target.value)} placeholder="0.70"/><p className="text-xs text-slate-400">Ej: 0.70 = alerta si predicción {'>'} 70%</p></div>
            <div className="space-y-2"><Label>Límite tokens/mes</Label><Input value={maxTokens} onChange={e => setMaxTokens(e.target.value)} placeholder="100000"/></div>
          </div>
          <div className="flex items-center gap-3"><input type="checkbox" checked={chatDataAccess} onChange={e => setChatDataAccess(e.target.checked)} className="h-4 w-4"/><Label>Permitir acceso a datos reales (NLQ)</Label></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Prompt del Sistema</CardTitle></CardHeader>
        <CardContent className="space-y-2"><textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={3} placeholder="Prompt personalizado para el modelo..." className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"/></CardContent>
      </Card>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {saved && <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Configuración guardada</div>}

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="gap-2">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
        Guardar configuración
      </Button>
    </div>
  );
}
