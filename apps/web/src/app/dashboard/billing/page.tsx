"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { Plus, Trash2, Loader2, Play, Coins } from "lucide-react";

type Plan = { id: string; name: string; amount: { toString: () => string }; frequency: string; due_day: number; student_plans: { id: string; student_id: string }[] };

async function fetchPlans() {
  const res = await fetch("/api/billing/plans");
  return res.json() as Promise<{ data: { items: Plan[] } }>;
}

async function generateInvoices() {
  const now = new Date();
  const res = await fetch("/api/billing/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month: now.getMonth(), year: now.getFullYear() }) });
  if (!res.ok) throw new Error("Error");
  return res.json() as Promise<{ data: { generated: number; period: string } }>;
}

const FREQ_LABELS: Record<string, string> = { MONTHLY: "Mensual", BIMONTHLY: "Bimensual", QUARTERLY: "Trimestral", ANNUAL: "Anual" };

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["billing-plans"], queryFn: fetchPlans });
  const [name, setName] = useState(""); const [amount, setAmount] = useState(""); const [frequency, setFrequency] = useState("MONTHLY");
  const [dueDay, setDueDay] = useState("1"); const [error, setError] = useState(""); const [genResult, setGenResult] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/billing/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, amount: Number(amount), frequency, due_day: Number(dueDay) }) });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["billing-plans"] }); setName(""); setAmount(""); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/billing/plans/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-plans"] }),
  });

  const generateMutation = useMutation({
    mutationFn: generateInvoices,
    onSuccess: (d) => setGenResult(`${d.data.generated} facturas generadas para ${d.data.period}`),
    onError: (e: Error) => setError(e.message),
  });

  const plans = data?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Facturación Recurrente</h2><p className="text-sm text-slate-500">{plans.length} planes configurados</p></div>

      {/* Generate invoices */}
      <Card>
        <CardHeader><CardTitle className="text-base">Generar facturas del mes</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">Crea automáticamente facturas pendientes para todos los estudiantes con planes activos.</p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4"/>}
            Generar facturas
          </Button>
          {genResult && <p className="mt-2 text-sm text-emerald-600">{genResult}</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Create plan */}
      <Card>
        <CardHeader><CardTitle className="text-base">Nuevo plan de cobro</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Mensualidad"/></div>
            <div className="space-y-2"><Label>Importe (€)</Label><Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="350"/></div>
            <div className="space-y-2"><Label>Frecuencia</Label><select value={frequency} onChange={e=>setFrequency(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="MONTHLY">Mensual</option><option value="BIMONTHLY">Bimensual</option><option value="QUARTERLY">Trimestral</option><option value="ANNUAL">Anual</option></select></div>
            <div className="space-y-2"><Label>Día de cobro</Label><Input type="number" min="1" max="31" value={dueDay} onChange={e=>setDueDay(e.target.value)}/></div>
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!name || !amount || createMutation.isPending}><Plus className="h-4 w-4"/> Crear plan</Button>
        </CardContent>
      </Card>

      {/* Plans list */}
      <div className="space-y-3">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400"/> : plans.length === 0 ? <p className="text-sm text-slate-400">Sin planes. Crea tu primer plan de cobro recurrente.</p> :
          plans.map(p => (
            <Card key={p.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500"/>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{FREQ_LABELS[p.frequency] ?? p.frequency}</span>
                </div>
                <button onClick={() => deleteMutation.mutate(p.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="font-medium text-slate-900">{Number(p.amount).toFixed(0)}€</span>
                  <span>Día {p.due_day}</span>
                  <span>{p.student_plans.length} estudiantes asignados</span>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  );
}
