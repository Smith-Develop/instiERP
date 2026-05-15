"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Megaphone } from "lucide-react";

type Announcement = { id: string; title: string; content: string; target: string; created_at: Date };

export function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  async function handleDelete(id: string) { if(!confirm("¿Eliminar anuncio?")) return; setDeletingId(id); await fetch(`/api/announcements/${id}`,{method:"DELETE"}); router.refresh(); }

  if (announcements.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-4"><Megaphone className="h-8 w-8 text-slate-400"/></div>
      <h3 className="text-lg font-semibold text-slate-900">No hay anuncios</h3>
      <p className="max-w-sm text-sm text-slate-500">Crea el primer anuncio para la comunidad educativa.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {announcements.map(a => (
        <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{a.title}</h3>
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{a.target}</span>
                <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString("es-ES",{dateStyle:"long"})}</span>
              </div>
            </div>
            <button onClick={()=>handleDelete(a.id)} disabled={deletingId===a.id} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Eliminar"><Trash2 className="h-4 w-4"/></button>
          </div>
        </div>
      ))}
    </div>
  );
}
