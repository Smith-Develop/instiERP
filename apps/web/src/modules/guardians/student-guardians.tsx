"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Label } from "@insti/ui";
import { Plus, Trash2, Loader2 } from "lucide-react";

type Guardian = { id: string; first_name: string; last_name: string; relationship: string | null; phone: string | null };
type Link = { id: string; guardian: Guardian };

async function fetchLinks(studentId: string) {
  const res = await fetch(`/api/student-guardians?studentId=${studentId}`);
  return res.json() as Promise<{ data: { items: Link[] } }>;
}

async function fetchAvailableGuardians() {
  const res = await fetch("/api/guardians");
  return res.json() as Promise<{ data: { items: Guardian[] } }>;
}

export function StudentGuardians({ studentId, editing = false }: { studentId: string; editing?: boolean }) {
  const queryClient = useQueryClient();
  const [guardianId, setGuardianId] = useState("");

  const { data: linksData, isLoading } = useQuery({
    queryKey: ["student-guardians", studentId],
    queryFn: () => fetchLinks(studentId),
    enabled: !!studentId,
  });

  const { data: availData } = useQuery({
    queryKey: ["guardians"],
    queryFn: fetchAvailableGuardians,
    enabled: editing, // Only fetch when editing
  });

  const linkMutation = useMutation({
    mutationFn: (gId: string) => fetch("/api/student-guardians", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, guardianId: gId }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["student-guardians", studentId] }); setGuardianId(""); },
  });

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => fetch(`/api/student-guardians/${linkId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-guardians", studentId] }),
  });

  const links = linksData?.data?.items ?? [];
  const existingIds = new Set(links.map(l => l.guardian.id));
  const available = (availData?.data?.items ?? []).filter(g => !existingIds.has(g.id));

  if (isLoading) return <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin"/> Cargando...</div>;

  return (
    <div className="space-y-4">
      {links.length === 0 ? (
        <p className="text-sm text-slate-400">Sin tutores asignados.</p>
      ) : (
        <div className="space-y-2">
          {links.map(l => (
            <div key={l.id} className="flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{l.guardian.last_name}, {l.guardian.first_name}</p>
                <p className="text-xs text-slate-500">{l.guardian.relationship ?? "—"} · {l.guardian.phone ?? "—"}</p>
              </div>
              {editing && (
                <button onClick={() => unlinkMutation.mutate(l.id)} disabled={unlinkMutation.isPending && unlinkMutation.variables === l.id}
                  className="rounded-md p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Quitar tutor">
                  <Trash2 className="h-4 w-4"/>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="border-t pt-4">
          <Label>Añadir tutor</Label>
          <div className="flex gap-2 mt-1.5">
            <select value={guardianId} onChange={e => setGuardianId(e.target.value)} className="flex h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">
              <option value="">Seleccionar tutor</option>
              {available.map(g => <option key={g.id} value={g.id}>{g.last_name}, {g.first_name}</option>)}
            </select>
            <Button onClick={() => guardianId && linkMutation.mutate(guardianId)} disabled={!guardianId || linkMutation.isPending}>
              <Plus className="h-4 w-4 mr-1"/> {linkMutation.isPending ? "..." : "Añadir"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
