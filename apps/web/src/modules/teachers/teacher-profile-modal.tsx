"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X, Pencil, Trash2, Loader2, Camera, Download, Upload, Image, FileText, User, BookOpen, Clock, GraduationCap } from "lucide-react";

type TeacherFull = {
  id: string; first_name: string; last_name: string; specialties: string | null;
  is_active: boolean; photo_url: string | null;
};

type Doc = { id: string; original_name: string; url: string; mime_type: string; size_bytes: number; created_at: string };

const editSchema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1),
  specialties: z.string().optional(), is_active: z.boolean(),
});
type EditForm = z.infer<typeof editSchema>;

async function fetchTeacher(id: string) {
  const r = await fetch(`/api/teachers/${id}`);
  const d = await r.json();
  return d.data as TeacherFull & {
    teacher_assignments: { id: string; subject: { id: string; name: string }; grade: { name: string }; section: { name: string } | null }[];
    schedules: { id: string; day_of_week: number; start_time: string; end_time: string; classroom: string | null; subject: { name: string }; grade: { name: string }; section: { name: string } | null }[];
  };
}

async function fetchDocs(entityId: string) {
  const r = await fetch(`/api/documents?entityType=teacher&entityId=${entityId}`);
  return ((await r.json()).data?.items ?? []) as Doc[];
}

function formatSize(b: number) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`; }
const mimeIcon = (m: string) => m.startsWith("image/") ? Image : FileText;

const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

type Props = { teacherId: string; open: boolean; onClose: () => void };

export function TeacherProfileModal({ teacherId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docName, setDocName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: full, isLoading } = useQuery({
    queryKey: ["teacher-profile", teacherId],
    queryFn: () => fetchTeacher(teacherId),
    enabled: open && !!teacherId,
  });

  const { data: docs = [], refetch: refetchDocs } = useQuery({
    queryKey: ["documents", "teacher", teacherId],
    queryFn: () => fetchDocs(teacherId),
    enabled: open && !!teacherId,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (full) reset({ first_name: full.first_name, last_name: full.last_name, specialties: full.specialties ?? "", is_active: full.is_active });
  }, [full, reset]);

  async function onSave(data: EditForm) {
    await fetch(`/api/teachers/${teacherId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setEditing(false); queryClient.invalidateQueries({ queryKey: ["teacher-profile", teacherId] }); queryClient.invalidateQueries();
  }

  async function onDelete() { setDeleting(true); await fetch(`/api/teachers/${teacherId}`, { method: "DELETE" }); onClose(); queryClient.invalidateQueries(); }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPhoto(true);
    const fd = new FormData(); fd.append("file", file); fd.append("entityType", "teacher"); fd.append("entityId", teacherId);
    const r = await fetch("/api/documents", { method: "POST", body: fd });
    const d = await r.json();
    if (d.data?.url) {
      await fetch(`/api/teachers/${teacherId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo_url: d.data.url }) });
      queryClient.invalidateQueries({ queryKey: ["teacher-profile", teacherId] });
    }
    setUploadingPhoto(false);
  }

  async function handleDocUpload() {
    const file = fileInputRef.current?.files?.[0]; if (!file) return;
    setUploadingDoc(true);
    const name = docName.trim() || file.name;
    const renamed = new File([file], name, { type: file.type });
    const fd = new FormData(); fd.append("file", renamed); fd.append("entityType", "teacher"); fd.append("entityId", teacherId);
    await fetch("/api/documents", { method: "POST", body: fd });
    setDocName(""); if (fileInputRef.current) fileInputRef.current.value = "";
    refetchDocs(); setUploadingDoc(false);
  }

  async function deleteDoc(docId: string) { await fetch(`/api/documents/${docId}`, { method: "DELETE" }); refetchDocs(); }

  if (!open) return null;

  const sections = ["personal", "subjects", "schedule", "docs"];
  const SectionIcon = ({ s }: { s: string }) => {
    switch(s) { case "personal": return <User className="h-4 w-4"/>; case "subjects": return <BookOpen className="h-4 w-4"/>; case "schedule": return <Clock className="h-4 w-4"/>; default: return <FileText className="h-4 w-4"/>; }
  };
  const SectionLabel = ({ s }: { s: string }) => {
    switch(s) { case "personal": return "Datos"; case "subjects": return "Asignaturas"; case "schedule": return "Horario"; default: return "Docs"; }
  };

  const assignments = full?.teacher_assignments ?? [];
  const schedules = full?.schedules ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-4xl flex flex-col rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden" style={{ height: "80vh", minHeight: "80vh", maxHeight: "80vh" }}>
        {/* HEADER */}
        <div className="shrink-0 flex items-start justify-between bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] text-white px-8 py-6">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              {full?.photo_url ? (
                <img src={full.photo_url} key={full.photo_url} className="h-20 w-20 rounded-lg object-cover border-2 border-white/30" alt="" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/15 text-white text-3xl font-bold border-2 border-white/30">{full?.first_name?.[0]}{full?.last_name?.[0]}</div>
              )}
              <label className="absolute -bottom-2 -right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-[#1E3A5F] shadow hover:bg-slate-100">
                {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4"/>}
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto}/>
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{full?.first_name} {full?.last_name}</h1>
              <p className="mt-1 text-sm text-white/80">{full?.specialties || "Sin especialidades"}</p>
              <span className={`inline-flex rounded-md px-2 py-0.5 mt-2 text-xs font-semibold ${full?.is_active ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"}`}>{full?.is_active ? "Activo" : "Inactivo"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"><Pencil className="h-4 w-4"/> Editar</button>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="rounded-md p-1.5 text-white/60 hover:text-white hover:bg-white/10"><Trash2 className="h-4 w-4"/></button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setConfirmDelete(false)} className="rounded-md px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10">No</button>
                    <button onClick={onDelete} disabled={deleting} className="rounded-md bg-red-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50">{deleting ? "..." : "Sí"}</button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10">Cancelar</button>
            )}
            <button onClick={onClose} className="rounded-md p-1.5 text-white/50 hover:text-white hover:bg-white/10"><X className="h-5 w-5"/></button>
          </div>
        </div>

        {/* NAV */}
        <div className="shrink-0 flex border-b bg-slate-50 px-8 overflow-x-auto">
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === s ? "border-[#1E3A5F] text-[#1E3A5F]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
              <SectionIcon s={s}/> <SectionLabel s={s}/>
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400"/></div>
          ) : full ? (
            <div>
              {activeSection === "personal" && (
                <div className="rounded-lg border bg-white p-6 max-w-2xl">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="h-4 w-4 text-[#1E3A5F]"/> Datos Personales</h3>
                  {editing ? (
                    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5"><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div>
                        <div className="space-y-1.5"><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div>
                      </div>
                      <div className="space-y-1.5"><Label>Especialidades</Label><Input {...register("specialties")} placeholder="Matemáticas, Física"/></div>
                      <div className="flex items-center gap-3"><input type="checkbox" {...register("is_active")} className="h-4 w-4"/><Label>Activo</Label></div>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar"}</Button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      {[{l:"Nombre",v:`${full.first_name} ${full.last_name}`},{l:"Especialidades",v:full.specialties || "—"},{l:"Estado",v:full.is_active ? "Activo" : "Inactivo"}].map(r=><div key={r.l} className="flex gap-2"><span className="text-slate-400 w-36 shrink-0">{r.l}</span><span className="font-medium text-slate-900">{r.v}</span></div>)}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "subjects" && (
                <div className="rounded-lg border bg-white p-6 max-w-2xl">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#1E3A5F]"/> Asignaturas</h3>
                  {assignments.length ? (
                    <div className="space-y-2">
                      {assignments.map(a => (
                        <div key={a.id} className="flex items-center justify-between rounded-md border bg-slate-50 px-5 py-3">
                          <div><p className="font-medium text-slate-900">{a.subject.name}</p><p className="text-xs text-slate-500">{a.grade.name}{a.section ? ` · ${a.section.name}` : ""}</p></div>
                          <GraduationCap className="h-4 w-4 text-slate-400"/>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400">Sin asignaturas asignadas.</p>}
                  <p className="mt-4 text-xs text-slate-400">Para añadir o quitar asignaturas, usa la sección <a href="/dashboard/assignments" className="text-[#2563EB] hover:underline">Asignaciones</a> del menú lateral.</p>
                </div>
              )}

              {activeSection === "schedule" && (
                <div className="rounded-lg border bg-white p-6 max-w-2xl">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-[#1E3A5F]"/> Horario</h3>
                  {schedules.length ? (
                    <div className="space-y-2">
                      {schedules.map(s => (
                        <div key={s.id} className="flex items-center justify-between rounded-md border bg-slate-50 px-5 py-3">
                          <div><p className="font-medium text-slate-900">{s.subject.name}</p><p className="text-xs text-slate-500">{s.grade.name}{s.section ? ` ${s.section.name}` : ""}{s.classroom ? ` · Aula ${s.classroom}` : ""}</p></div>
                          <div className="text-right"><p className="text-sm font-medium text-slate-700">{s.start_time} — {s.end_time}</p><p className="text-xs text-slate-400">{DAYS[s.day_of_week - 1] ?? s.day_of_week}</p></div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400">Sin horario asignado.</p>}
                </div>
              )}

              {activeSection === "docs" && (
                <div className="rounded-lg border bg-white p-6 max-w-2xl">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-[#1E3A5F]"/> Documentos</h3>
                  <div className="space-y-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1.5"><Label>Nombre</Label><Input value={docName} onChange={e=>setDocName(e.target.value)} placeholder="Ej: CV, Título..."/></div>
                      <div className="space-y-1.5"><Label>Archivo</Label>
                        <div className="flex gap-2"><input ref={fileInputRef} type="file" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#1E3A5F] file:px-3 file:py-1 file:text-xs file:font-medium file:text-white" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/><Button onClick={handleDocUpload} disabled={!fileInputRef.current?.files?.[0]||uploadingDoc} className="gap-1 shrink-0">{uploadingDoc?<Loader2 className="h-4 w-4 animate-spin"/>:<Upload className="h-4 w-4"/>}Subir</Button></div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      {docs.length===0 ? <p className="text-sm text-slate-400 text-center py-8">Sin documentos.</p> :
                        docs.map(doc=>{const Icon=mimeIcon(doc.mime_type);return(<div key={doc.id} className="flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3"><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-slate-400"/><div><p className="text-sm font-medium text-slate-900 truncate">{doc.original_name}</p><p className="text-xs text-slate-400">{formatSize(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString("es-ES")}</p></div></div><div className="flex gap-1"><a href={doc.url} target="_blank" className="rounded-md p-1.5 text-slate-400 hover:text-[#2563EB]" title="Descargar"><Download className="h-4 w-4"/></a><button onClick={()=>deleteDoc(doc.id)} className="rounded-md p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></div></div>)})}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t bg-slate-50 px-8 py-3 text-xs text-slate-400 flex items-center justify-between"><span>Expediente #{teacherId?.slice(0,8)}</span><span>Insti ERP</span></div>
      </div>
    </div>
  );
}
