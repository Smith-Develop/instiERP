"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@insti/ui";
import { z } from "zod";
import { X, Pencil, Trash2, Loader2, Camera, User, BookOpen, ClipboardCheck, AlertTriangle, FileText, Users } from "lucide-react";
import { StudentGuardians } from "@/modules/guardians/student-guardians";

// ---- Types ----
type Student = {
  id: string; first_name: string; last_name: string; document_type: string | null; document_number: string | null;
  birth_date: string | null; gender: string | null; address: string | null;
  medical_notes: string | null; emergency_contact: string | null; emergency_phone: string | null;
  is_active: boolean; photo_url: string | null;
};

type GradeItem = { id: string; name: string; weight: string };
type StudentGrade = { id: string; score: string | null; grade_item: GradeItem };
type Attendance = { id: string; date: string; status: string };
type Behavior = { id: string; type: string; severity: string | null; description: string; created_at: string };

// ---- Schema ----
const editSchema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1),
  document_type: z.string().optional(), document_number: z.string().optional(),
  birth_date: z.string().optional(), gender: z.string().optional(), address: z.string().optional(),
  medical_notes: z.string().optional(), emergency_contact: z.string().optional(), emergency_phone: z.string().optional(),
  is_active: z.boolean(),
});

type EditForm = z.infer<typeof editSchema>;

// ---- API helpers ----
async function fetchStudent(id: string) {
  const r = await fetch(`/api/students/${id}`);
  const d = await r.json();
  return d.data as Student & {
    enrollments: { grade: { name: string }; section: { name: string } }[];
    student_guardians: { id: string; guardian: { id: string; first_name: string; last_name: string; relationship: string | null; phone: string | null } }[];
    attendances: Attendance[];
    student_grades: StudentGrade[];
    behavior_reports: Behavior[];
  };
}

async function updateStudent(id: string, data: EditForm) {
  await fetch(`/api/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}

async function deleteStudent(id: string) {
  await fetch(`/api/students/${id}`, { method: "DELETE" });
}

async function uploadPhoto(studentId: string, file: File) {
  const fd = new FormData(); fd.append("file", file); fd.append("entityType", "student"); fd.append("entityId", studentId);
  const r = await fetch("/api/documents", { method: "POST", body: fd });
  const d = await r.json();
  if (d.data?.url) {
    await fetch(`/api/students/${studentId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo_url: d.data.url }) });
  }
  return d.data?.url;
}

// ---- Component ----
type Props = { studentId: string; open: boolean; onClose: () => void };

export function StudentProfileModal({ studentId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState("data");

  const { data: full, isLoading, error } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: () => fetchStudent(studentId),
    enabled: open && !!studentId,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (full) reset({
      first_name: full.first_name, last_name: full.last_name,
      document_type: full.document_type ?? "", document_number: full.document_number ?? "",
      birth_date: full.birth_date?.slice(0, 10) ?? "", gender: full.gender ?? "", address: full.address ?? "",
      medical_notes: full.medical_notes ?? "", emergency_contact: full.emergency_contact ?? "", emergency_phone: full.emergency_phone ?? "",
      is_active: full.is_active,
    });
  }, [full, reset]);

  const enrollment = full?.enrollments?.[0];

  async function onSave(data: EditForm) {
    await updateStudent(studentId, data);
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["student-profile", studentId] });
    queryClient.invalidateQueries({ queryKey: ["students"] });
  }

  async function onDelete() {
    setDeleting(true);
    await deleteStudent(studentId);
    onClose();
    queryClient.invalidateQueries({ queryKey: ["students"] });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPhoto(true);
    await uploadPhoto(studentId, file);
    queryClient.invalidateQueries({ queryKey: ["student-profile", studentId] });
    setUploadingPhoto(false);
  }

  if (!open) return null;

  const F = "space-y-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              {full?.photo_url ? (
                <img src={full.photo_url} className="h-12 w-12 rounded-full object-cover" alt="" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] text-lg font-bold">
                  {full?.first_name?.[0]}{full?.last_name?.[0]}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#1E3A5F] text-white hover:bg-[#2D5A8A]">
                {uploadingPhoto ? <Loader2 className="h-3 w-3 animate-spin"/> : <Camera className="h-3 w-3"/>}
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto}/>
              </label>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{full?.first_name} {full?.last_name}</h2>
              <p className="text-xs text-slate-500">
                {enrollment ? `${enrollment.grade.name} ${enrollment.section.name}` : "Sin matrícula"}
                {full?.document_number ? ` · ${full.document_type ?? ""} ${full.document_number}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4"/> Editar</Button>
                {!confirmDelete ? (
                  <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4"/></Button>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>No</Button>
                    <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>{deleting ? "..." : "Sí, eliminar"}</Button>
                  </div>
                )}
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
            )}
            <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400"/></div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">Error al cargar</div>
        ) : !full ? null : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pt-4">
            <TabsList className="mb-4">
              <TabsTrigger value="data"><User className="h-4 w-4 mr-1"/> Datos</TabsTrigger>
              <TabsTrigger value="guardians"><Users className="h-4 w-4 mr-1"/> Tutores</TabsTrigger>
              <TabsTrigger value="grades"><BookOpen className="h-4 w-4 mr-1"/> Notas</TabsTrigger>
              <TabsTrigger value="attendance"><ClipboardCheck className="h-4 w-4 mr-1"/> Asistencia</TabsTrigger>
              <TabsTrigger value="behavior"><AlertTriangle className="h-4 w-4 mr-1"/> Conducta</TabsTrigger>
              <TabsTrigger value="docs"><FileText className="h-4 w-4 mr-1"/> Docs</TabsTrigger>
            </TabsList>

            {/* Data tab */}
            <TabsContent value="data" className="pb-6">
              {editing ? (
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={F}><Label>Nombre *</Label><Input {...register("first_name")}/>{errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}</div>
                    <div className={F}><Label>Apellidos *</Label><Input {...register("last_name")}/>{errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}</div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className={F}><Label>Tipo doc.</Label><select {...register("document_type")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div>
                    <div className={F}><Label>Número</Label><Input {...register("document_number")}/></div>
                    <div className={F}><Label>Nacimiento</Label><Input type="date" {...register("birth_date")}/></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={F}><Label>Género</Label><select {...register("gender")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"><option value="">—</option><option value="M">M</option><option value="F">F</option></select></div>
                    <div className={F}><Label>Dirección</Label><Input {...register("address")}/></div>
                  </div>
                  <div className={F}><Label>Notas médicas</Label><Input {...register("medical_notes")}/></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={F}><Label>Contacto emergencia</Label><Input {...register("emergency_contact")}/></div>
                    <div className={F}><Label>Tel. emergencia</Label><Input type="tel" {...register("emergency_phone")}/></div>
                  </div>
                  <div className="flex items-center gap-3"><input type="checkbox" {...register("is_active")} className="h-4 w-4"/><Label>Activo</Label></div>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar cambios"}</Button>
                </form>
              ) : (
                <div className="grid gap-3 text-sm">
                  {[{l:"Documento",v:full.document_number ? `${full.document_type ?? ""} ${full.document_number}` : "—"},{l:"Fecha nacimiento",v:full.birth_date ? new Date(full.birth_date).toLocaleDateString("es-ES") : "—"},{l:"Género",v:full.gender === "M" ? "Masculino" : full.gender === "F" ? "Femenino" : "—"},{l:"Dirección",v:full.address || "—"},{l:"Notas médicas",v:full.medical_notes || "—"},{l:"Contacto emergencia",v:full.emergency_contact || "—"},{l:"Tel. emergencia",v:full.emergency_phone || "—"},{l:"Estado",v:full.is_active ? "Activo" : "Inactivo"}].map(r=><div key={r.l} className="flex gap-2"><span className="w-32 shrink-0 text-slate-500">{r.l}</span><span className="font-medium text-slate-900">{r.v}</span></div>)}
                </div>
              )}
            </TabsContent>

            {/* Guardians tab */}
            <TabsContent value="guardians" className="pb-6">
              <StudentGuardians studentId={studentId} />
            </TabsContent>

            {/* Grades tab */}
            <TabsContent value="grades" className="pb-6">
              {full.student_grades?.length ? (
                <div className="space-y-2">
                  {(() => { const map = new Map<string, StudentGrade[]>(); for(const g of full.student_grades){ const k = g.grade_item.name; if(!map.has(k)) map.set(k,[]); map.get(k)!.push(g); } return [...map.entries()]; })().map(([name, grades]) => (
                    <div key={name} className="rounded-md border px-4 py-3">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">{name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {grades.map(g => (
                          <span key={g.id} className="inline-flex rounded-md border bg-white px-3 py-1 text-sm">
                            <span className="font-medium">{g.score ? Number(g.score).toFixed(1) : "—"}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {[...new Set(full.student_grades.map(g => g.grade_item.name))].length === 0 && <p className="text-sm text-slate-400">Sin calificaciones.</p>}
                </div>
              ) : <p className="text-sm text-slate-400">Sin calificaciones registradas.</p>}
            </TabsContent>

            {/* Attendance tab */}
            <TabsContent value="attendance" className="pb-6">
              {full.attendances?.length ? (
                <div>
                  <div className="mb-4 flex gap-4 text-sm">
                    <span className="text-emerald-600">✓ {full.attendances.filter(a=>a.status==="PRESENTE").length} presente</span>
                    <span className="text-red-500">✕ {full.attendances.filter(a=>a.status==="AUSENTE").length} ausente</span>
                    <span className="text-slate-500">Total: {full.attendances.length}</span>
                  </div>
                  <div className="space-y-1">
                    {full.attendances.slice(0, 30).map(a => (
                      <div key={a.id} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                        <span>{new Date(a.date).toLocaleDateString("es-ES", { dateStyle: "long" })}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${a.status==="PRESENTE"?"bg-emerald-50 text-emerald-700":a.status==="AUSENTE"?"bg-red-50 text-red-700":a.status==="TARDANZA"?"bg-amber-50 text-amber-700":"bg-blue-50 text-blue-700"}`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-sm text-slate-400">Sin registros de asistencia.</p>}
            </TabsContent>

            {/* Behavior tab */}
            <TabsContent value="behavior" className="pb-6">
              {full.behavior_reports?.length ? (
                <div className="space-y-2">
                  {full.behavior_reports.map(r => (
                    <div key={r.id} className="rounded-md border px-4 py-3">
                      <div className="flex items-center gap-2"><span className={`text-xs font-medium px-2 py-0.5 rounded ${r.severity==="GRAVE"?"bg-red-50 text-red-700":r.severity==="MODERADO"?"bg-amber-50 text-amber-700":"bg-blue-50 text-blue-700"}`}>{r.type}</span><span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString("es-ES")}</span></div>
                      <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">Sin reportes de conducta.</p>}
            </TabsContent>

            {/* Docs tab */}
            <TabsContent value="docs" className="pb-6">
              {/* Simple doc list inline */}
              <DocumentTab studentId={studentId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Mini document list for the profile tab
function DocumentTab({ studentId }: { studentId: string }) {
  const { data } = useQuery({
    queryKey: ["documents", "student", studentId],
    queryFn: async () => {
      const r = await fetch(`/api/documents?entityType=student&entityId=${studentId}`);
      return r.json();
    },
  });
  const docs = (data?.data?.items ?? []) as { id: string; original_name: string; url: string; mime_type: string; size_bytes: number; created_at: string }[];
  if (!docs.length) return <p className="text-sm text-slate-400">Sin documentos.</p>;
  return (
    <div className="space-y-2">
      {docs.map(d => (
        <a key={d.id} href={d.url} target="_blank" className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-slate-50 text-sm">
          <span className="font-medium text-slate-900 truncate">{d.original_name}</span>
          <span className="text-xs text-slate-400">{(d.size_bytes/1024).toFixed(0)} KB</span>
        </a>
      ))}
    </div>
  );
}
