"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Upload, FileText, Trash2, Loader2, Download, Image } from "lucide-react";

type Doc = { id: string; original_name: string; mime_type: string; size_bytes: number; url: string; created_at: Date };

async function fetchDocs(entityType: string, entityId: string) {
  const res = await fetch(`/api/documents?entityType=${entityType}&entityId=${entityId}`);
  if (!res.ok) throw new Error("Error");
  return res.json() as Promise<{ data: { items: Doc[] } }>;
}

async function uploadFile(formData: FormData) {
  const res = await fetch("/api/documents", { method: "POST", body: formData });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Error"); }
  return res.json();
}

async function deleteDoc(id: string) {
  await fetch(`/api/documents/${id}`, { method: "DELETE" });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const mimeIcon = (mime: string) => mime.startsWith("image/") ? Image : FileText;

export function DocumentList({ entityType, entityId }: { entityType: string; entityId: string }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["documents", entityType, entityId],
    queryFn: () => fetchDocs(entityType, entityId),
    enabled: !!entityId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDoc,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents", entityType, entityId] }),
  });

  const docs = data?.data?.items ?? [];

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);
      await uploadFile(fd);
      queryClient.invalidateQueries({ queryKey: ["documents", entityType, entityId] });
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setUploading(false); }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Documentos</CardTitle>
        <label className="cursor-pointer inline-flex items-center gap-1 rounded-md bg-[#1E3A5F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2D5A8A]">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Upload className="h-3.5 w-3.5"/>}
          Subir
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
        </label>
      </CardHeader>
      <CardContent className="pt-0">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 mb-3">{error}</div>}
        {isLoading ? (
          <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400"/></div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Sin documentos. Sube DNI, fotos, certificados médicos.</p>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => {
              const Icon = mimeIcon(doc.mime_type);
              return (
                <div key={doc.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-slate-400"/>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.original_name}</p>
                      <p className="text-xs text-slate-400">{formatSize(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-slate-400 hover:text-[#2563EB]" title="Descargar"><Download className="h-4 w-4"/></a>
                    <button onClick={() => deleteMutation.mutate(doc.id)} disabled={deleteMutation.isPending && deleteMutation.variables === doc.id} className="rounded p-1 text-slate-400 hover:text-red-600 disabled:opacity-50" title="Eliminar"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
