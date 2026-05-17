"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X, Pencil, Trash2, Loader2, Download, Upload, Image, FileText, User, Users, UserPlus } from "lucide-react";

type AdmissionFull = {
  id: string; first_name: string; last_name: string; document_type: string | null; document_number: string | null;
  birth_date: string | null; gender: string | null; address: string | null;
  desired_grade_id: string | null; guardian_name: string | null; guardian_relationship: string | null;
  guardian_phone: string | null; guardian_email: string | null; medical_notes: string | null;
  emergency_contact: string | null; emergency_phone: string | null; status: string; notes: string | null;
};
type Doc = { id: string; original_name: string; url: string; mime_type: string; size_bytes: number; created_at: string };

const editSchema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1),
  document_type: z.string().optional(), document_number: z.string().optional(),
  birth_date: z.string().optional(), gender: z.string().optional(), address: z.string().optional(),
  desired_grade_id: z.string().optional(), guardian_name: z.string().optional(), guardian_relationship: z.string().optional(),
  guardian_phone: z.string().optional(), guardian_email: z.string().email().optional().or(z.literal("")),
  medical_notes: z.string().optional(), emergency_contact: z.string().optional(), emergency_phone: z.string().optional(),
  status: z.string(), notes: z.string().optional(),
});
type EditForm = z.infer<typeof editSchema>;

async function fetchAdmission(id: string) {
  const r = await fetch(`/api/admissions/${id}`);
  return (await r.json()).data as AdmissionFull;
}
async function fetchDocs(entityId: string) { const r = await fetch(`/api/documents?entityType=admission&entityId=${entityId}`); return ((await r.json()).data?.items ?? []) as Doc[]; }
async function fetchGrades() { const r = await fetch("/api/academic/sections"); const d = await r.json(); const m = new Map<string, string>(); for (const s of (d.data ?? []) as { gradeId: string; gradeName: string }[]) { if (!m.has(s.gradeId)) m.set(s.gradeId, s.gradeName) } return [...m.entries()].map(([id, name]) => ({ id, name })); }
function formatSize(b: number) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`; }
const mimeIcon = (m: string) => m.startsWith("image/") ? Image : FileText;
const STATUS_LABELS: Record<string, string> = { PENDIENTE: "Pendiente", EN_TRAMITE: "En trámite", ADMITIDO: "Admitido", NO_ADMITIDO: "No admitido", MATRICULADO: "Matriculado" };
const STATUS_COLORS: Record<string, string> = { PENDIENTE: "bg-amber-400/20 text-amber-200", EN_TRAMITE: "bg-blue-400/20 text-blue-200", ADMITIDO: "bg-emerald-400/20 text-emerald-200", NO_ADMITIDO: "bg-red-400/20 text-red-200", MATRICULADO: "bg-purple-400/20 text-purple-200" };

type Props = { admissionId: string; open: boolean; onClose: () => void };

export function AdmissionProfileModal({ admissionId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docName, setDocName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: full, isLoading } = useQuery({ queryKey: ["admission", admissionId], queryFn: () => fetchAdmission(admissionId), enabled: open && !!admissionId });
  const { data: docs = [], refetch: refetchDocs } = useQuery({ queryKey: ["documents", "admission", admissionId], queryFn: () => fetchDocs(admissionId), enabled: open && !!admissionId });
  const { data: grades = [] } = useQuery({ queryKey: ["grades-brief"], queryFn: fetchGrades });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (full) reset({
      first_name: full.first_name, last_name: full.last_name, document_type: full.document_type ?? "", document_number: full.document_number ?? "",
      birth_date: full.birth_date?.slice(0, 10) ?? "", gender: full.gender ?? "", address: full.address ?? "",
      desired_grade_id: full.desired_grade_id ?? "", guardian_name: full.guardian_name ?? "", guardian_relationship: full.guardian_relationship ?? "",
      guardian_phone: full.guardian_phone ?? "", guardian_email: full.guardian_email ?? "",
      medical_notes: full.medical_notes ?? "", emergency_contact: full.emergency_contact ?? "", emergency_phone: full.emergency_phone ?? "",
      status: full.status, notes: full.notes ?? "",
    });
  }, [full, reset]);

  async function onSave(data: EditForm) { await fetch(`/api/admissions/${admissionId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); setEditing(false); queryClient.invalidateQueries({ queryKey: ["admission", admissionId] }); queryClient.invalidateQueries(); }
  async function onDelete() { setDeleting(true); await fetch(`/api/admissions/${admissionId}`, { method: "DELETE" }); onClose(); queryClient.invalidateQueries(); }

  async function handleConvert() {
    if (!confirm("¿Convertir en estudiante? Se creará el estudiante, tutor y matrícula.")) return;
    setConverting(true);
    try {
      const r = await fetch("/api/admissions/convert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admissionId }) });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      onClose(); queryClient.invalidateQueries();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setConverting(false); }
  }

  async function handleDocUpload() {
    const file = fileInputRef.current?.files?.[0]; if (!file) return;
    setUploadingDoc(true);
    const name = docName.trim() || file.name;
    const renamed = new File([file], name, { type: file.type });
    const fd = new FormData(); fd.append("file", renamed); fd.append("entityType", "admission"); fd.append("entityId", admissionId);
    await fetch("/api/documents", { method: "POST", body: fd });
    setDocName(""); if (fileInputRef.current) fileInputRef.current.value = "";
    refetchDocs(); setUploadingDoc(false);
  }
  async function deleteDoc(docId: string) { await fetch(`/api/documents/${docId}`, { method: "DELETE" }); refetchDocs(); }

  if (!open) return null;

  const gradeLabel = grades.find(g => g.id === full?.desired_grade_id)?.name;
  const F = "space-y-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-4xl flex flex-col rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden" style={{ height: "80vh", minHeight: "80vh", maxHeight: "80vh" }}>
        {/* HEADER */}
        <div className="shrink-0 flex items-start justify-between bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] text-white px-8 py-6">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/15 text-white text-3xl font-bold border-2 border-white/30">{full?.first_name?.[0]}{full?.last_name?.[0]}</div>
            <div>
              <h1 className="text-2xl font-bold">{full?.first_name} {full?.last_name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/80">
                {full?.document_number && <span>{full.document_type ?? ""} {full.document_number}</span>}
                {full?.birth_date && <span>Nac. {new Date(full.birth_date).toLocaleDateString("es-ES")}</span>}
                {gradeLabel && <span>Grado: {gradeLabel}</span>}
              </div>
              <span className={`inline-flex rounded-md px-2 py-0.5 mt-2 text-xs font-semibold ${STATUS_COLORS[full?.status ?? "PENDIENTE"]}`}>{STATUS_LABELS[full?.status ?? "PENDIENTE"]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {full?.status === "ADMITIDO" && (
              <button onClick={handleConvert} disabled={converting} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                <UserPlus className="h-4 w-4" /> {converting ? "Convirtiendo..." : "Convertir a estudiante"}
              </button>
            )}
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"><Pencil className="h-4 w-4" /> Editar</button>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="rounded-md p-1.5 text-white/60 hover:text-white hover:bg-white/10"><Trash2 className="h-4 w-4" /></button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setConfirmDelete(false)} className="rounded-md px-2 py-1.5 text-xs font-medium text-white/70">No</button>
                    <button onClick={onDelete} disabled={deleting} className="rounded-md bg-red-500 px-2 py-1.5 text-xs font-medium text-white">{deleting ? "..." : "Sí"}</button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10">Cancelar</button>
            )}
            <button onClick={onClose} className="rounded-md p-1.5 text-white/50 hover:text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* SECTION NAV */}
        <div className="shrink-0 flex border-b bg-slate-50 px-8 overflow-x-auto">
          {["personal", "guardian", "docs"].map(s => (
            <button key={s} onClick={() => setActiveSection(s)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === s ? "border-[#1E3A5F] text-[#1E3A5F]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
              {s === "personal" ? <User className="h-4 w-4" /> : s === "guardian" ? <Users className="h-4 w-4" /> : <FileText className="h-4 w-4" />} {s === "personal" ? "Datos" : s === "guardian" ? "Tutor" : "Docs"}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div> : full ? (
            <div className="h-full">
              {activeSection === "personal" && (
                <div className="rounded-lg border bg-white p-6 h-full">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="h-4 w-4 text-[#1E3A5F]" /> Datos del Solicitante</h3>
                  {editing ? (
                    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className={F}><Label>Nombre *</Label><Input {...register("first_name")} />{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div>
                        <div className={F}><Label>Apellidos *</Label><Input {...register("last_name")} />{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className={F}><Label>Tipo doc.</Label><select {...register("document_type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div>
                        <div className={F}><Label>Número</Label><Input {...register("document_number")} /></div>
                        <div className={F}><Label>Nacimiento</Label><Input type="date" {...register("birth_date")} /></div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className={F}><Label>Género</Label><select {...register("gender")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="M">M</option><option value="F">F</option></select></div>
                        <div className={F}><Label>Dirección</Label><Input {...register("address")} /></div>
                      </div>
                      <div className={F}><Label>Grado al que aspira</Label><select {...register("desired_grade_id")} className="flex h-10 w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option>{grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className={F}><Label>Notas médicas</Label><Input {...register("medical_notes")} /></div>
                        <div className={F}><Label>Estado</Label><select {...register("status")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">{Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Contacto emergencia</Label><Input {...register("emergency_contact")} /></div><div className={F}><Label>Tel. emergencia</Label><Input type="tel" {...register("emergency_phone")} /></div></div>
                      <div className={F}><Label>Notas</Label><Input {...register("notes")} /></div>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar cambios"}</Button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      {[{ l: "Nombre", v: `${full.first_name} ${full.last_name}` }, { l: "Documento", v: full.document_number ? `${full.document_type ?? ""} ${full.document_number}` : "—" }, { l: "Fecha nac.", v: full.birth_date ? new Date(full.birth_date).toLocaleDateString("es-ES", { dateStyle: "long" }) : "—" }, { l: "Género", v: full.gender === "M" ? "Masculino" : full.gender === "F" ? "Femenino" : "—" }, { l: "Dirección", v: full.address || "—" }, { l: "Grado", v: gradeLabel || "—" }, { l: "Estado", v: STATUS_LABELS[full.status] }, { l: "Notas médicas", v: full.medical_notes || "—" }, { l: "Contacto emerg.", v: full.emergency_contact || "—" }, { l: "Tel. emerg.", v: full.emergency_phone || "—" }, { l: "Notas", v: full.notes || "—" }].map(r => (<div key={r.l} className="flex gap-2"><span className="text-slate-400 w-36 shrink-0">{r.l}</span><span className="font-medium text-slate-900">{r.v}</span></div>))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "guardian" && (
                <div className="rounded-lg border bg-white p-6 h-full">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-[#1E3A5F]" /> Datos del Tutor</h3>
                  {editing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Nombre tutor</Label><Input {...register("guardian_name")} /></div><div className={F}><Label>Parentesco</Label><Input {...register("guardian_relationship")} /></div></div>
                      <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Teléfono</Label><Input type="tel" {...register("guardian_phone")} /></div><div className={F}><Label>Email</Label><Input type="email" {...register("guardian_email")} /></div></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      {[{ l: "Nombre", v: full.guardian_name || "—" }, { l: "Parentesco", v: full.guardian_relationship || "—" }, { l: "Teléfono", v: full.guardian_phone || "—" }, { l: "Email", v: full.guardian_email || "—" }].map(r => (<div key={r.l} className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">{r.l}</span><span className="font-medium text-slate-900">{r.v}</span></div>))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "docs" && (
                <div className="rounded-lg border bg-white p-6 h-full">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-[#1E3A5F]" /> Documentos</h3>
                  <div className="space-y-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1.5"><Label>Nombre</Label><Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="DNI, certificado..." /></div>
                      <div className="space-y-1.5"><Label>Archivo</Label>
                        <div className="flex gap-2"><input ref={fileInputRef} type="file" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#1E3A5F] file:px-3 file:py-1 file:text-xs file:font-medium file:text-white" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /><Button onClick={handleDocUpload} disabled={!fileInputRef.current?.files?.[0] || uploadingDoc} className="gap-1 shrink-0">{uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Subir</Button></div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      {docs.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Sin documentos.</p> :
                        docs.map(doc => { const Icon = mimeIcon(doc.mime_type); return (<div key={doc.id} className="flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3"><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-slate-400" /><div><p className="text-sm font-medium text-slate-900 truncate">{doc.original_name}</p><p className="text-xs text-slate-400">{formatSize(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString("es-ES")}</p></div></div><div className="flex gap-1"><a href={doc.url} target="_blank" className="rounded-md p-1.5 text-slate-400 hover:text-[#2563EB]" title="Descargar"><Download className="h-4 w-4" /></a><button onClick={() => deleteDoc(doc.id)} className="rounded-md p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>) })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 border-t bg-slate-50 px-8 py-3 text-xs text-slate-400 flex items-center justify-between"><span>Admisión #{admissionId?.slice(0, 8)}</span><span>Insti ERP</span></div>
      </div>
    </div>
  );
}
