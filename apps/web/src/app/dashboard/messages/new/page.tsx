"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewMessagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch potential participants — for now just show all users from the same school
    fetch("/api/users").then(r => r.json()).then(d => {
      if (d.data?.items) setUsers(d.data.items);
    }).catch(() => {});
  }, []);

  function toggleUser(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: selected, initialMessage: message || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      const d = await res.json();
      router.push(`/dashboard/messages/${d.data.id}`); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/messages" className="rounded-md p-1 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5"/></Link>
        <div><h2 className="text-2xl font-bold text-slate-900">Nuevo mensaje</h2><p className="text-sm text-slate-500">Selecciona los destinatarios</p></div>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle>Destinatarios</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selected.includes(u.id)
                      ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {u.name}
                  <span className="text-xs opacity-70">({u.role})</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg">Mensaje (opcional)</Label>
              <Input id="msg" value={message} onChange={e => setMessage(e.target.value)} placeholder="Escribe un mensaje inicial..."/>
            </div>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </CardContent>
          <CardFooter className="flex gap-3 border-t pt-6">
            <Link href="/dashboard/messages"><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" disabled={loading || selected.length === 0}>{loading ? "Creando..." : "Iniciar conversación"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
