"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, CalendarDays } from "lucide-react";

type Event = { id: string; title: string; description: string | null; start_date: Date; end_date: Date; target: string };

export function EventList({ events }: { events: Event[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  async function handleDelete(id: string) { if(!confirm("¿Eliminar?")) return; setDeletingId(id); await fetch(`/api/events/${id}`,{method:"DELETE"}); router.refresh(); }
  if (events.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-4"><CalendarDays className="h-8 w-8 text-slate-400"/></div>
      <h3 className="text-lg font-semibold text-slate-900">No hay eventos</h3>
      <p className="max-w-sm text-sm text-slate-500">Agrega eventos al calendario escolar.</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {events.map(e => (
        <div key={e.id} className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300">
          <div className="shrink-0 w-14 text-center">
            <p className="text-xs font-medium uppercase text-slate-400">{new Date(e.start_date).toLocaleDateString("es-ES",{month:"short"})}</p>
            <p className="text-2xl font-bold text-slate-900">{new Date(e.start_date).getDate()}</p>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900">{e.title}</h3>
            {e.description && <p className="mt-1 text-sm text-slate-500">{e.description}</p>}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">{new Date(e.start_date).toLocaleDateString("es-ES",{dateStyle:"long"})}{new Date(e.end_date).toDateString() !== new Date(e.start_date).toDateString() ? ` — ${new Date(e.end_date).toLocaleDateString("es-ES",{dateStyle:"long"})}` : ""}</span>
              <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{e.target}</span>
            </div>
          </div>
          <button onClick={()=>handleDelete(e.id)} disabled={deletingId===e.id} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4"/></button>
        </div>
      ))}
    </div>
  );
}
