"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { Plus, Trash2, Loader2 } from "lucide-react";

type Period = { id: string; name: string; code: string; sort_order: number };

export function PeriodsManager() {
  const queryClient = useQueryClient();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/academic/periods")
      .then(r => r.json())
      .then(d => { if (d.data?.items) setPeriods(d.data.items); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const createMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/academic/periods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName, code: newCode, sort_order: periods.length }) });
      if (!r.ok) throw new Error((await r.json().catch(()=>({}))).error || "Error");
    },
    onSuccess: () => { setNewName(""); setNewCode(""); setError(""); load(); queryClient.invalidateQueries(); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/academic/periods/${id}`, { method: "DELETE" }); },
    onSuccess: () => { load(); queryClient.invalidateQueries(); },
  });

  return (
    <Card>
      <CardHeader><CardTitle>Períodos académicos</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : (
          <div className="space-y-2">
            {periods.length === 0 ? (
              <p className="text-sm text-slate-400">No hay períodos configurados para este año lectivo.</p>
            ) : (
              periods.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-2">
                  <div><p className="font-medium text-slate-900 text-sm">{p.name}</p><p className="text-xs text-slate-400">Código: {p.code}</p></div>
                  <button onClick={() => deleteMut.mutate(p.id)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                </div>
              ))
            )}
          </div>
        )}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Añadir período</p>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5"><Label>Nombre</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Trimestre 1" className="w-40"/></div>
            <div className="space-y-1.5"><Label>Código</Label><Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="T1" className="w-24"/></div>
            <Button onClick={() => createMut.mutate()} disabled={!newName || !newCode || createMut.isPending} size="sm"><Plus className="h-4 w-4"/> {createMut.isPending ? "..." : "Añadir"}</Button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
