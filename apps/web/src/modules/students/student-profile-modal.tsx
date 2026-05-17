"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@insti/ui";
import { z } from "zod";
import { X, Pencil, Trash2, Loader2, Camera, Download, Upload, Image, FileText, ChevronDown, User, Users, BookOpen, ClipboardCheck, AlertTriangle } from "lucide-react";
import { StudentGuardians } from "@/modules/guardians/student-guardians";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type StudentFull = {
  id: string; first_name: string; last_name: string; document_type: string | null; document_number: string | null;
  birth_date: string | null; gender: string | null; address: string | null;
  medical_notes: string | null; emergency_contact: string | null; emergency_phone: string | null;
  is_active: boolean; photo_url: string | null; admitted_at: string | null;
};

type GradeItem = { id: string; name: string; weight: string };
type StudentGrade = { id: string; score: string | null; grade_item: GradeItem };
type Attendance = { id: string; date: string; status: string };
type Behavior = { id: string; type: string; severity: string | null; description: string; created_at: string };
type Doc = { id: string; original_name: string; url: string; mime_type: string; size_bytes: number; created_at: string };

type YearOption = { id: string; label: string };
type HistoryData = {
  enrollments: { academic_year_id: string; academic_year: { year_label: string }; grade: { name: string }; section: { name: string } }[];
  gradesByYear: Record<string, { yearLabel: string; subjects: Record<string, { subjectName: string; items: { name: string; period: string; score: number | null }[] }> }>;
  attendanceByYear: Record<string, { yearLabel: string; presente: number; ausente: number; tardanza: number }>;
  behaviorByYear: Record<string, { yearLabel: string; reports: { type: string; severity: string | null; description: string; date: string }[] }>;
};

const editSchema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1),
  document_type: z.string().optional(), document_number: z.string().optional(),
  birth_date: z.string().optional(), gender: z.string().optional(), address: z.string().optional(),
  medical_notes: z.string().optional(), emergency_contact: z.string().optional(), emergency_phone: z.string().optional(),
  is_active: z.boolean(),
});
type EditForm = z.infer<typeof editSchema>;

async function fetchStudent(id: string) {
  const r = await fetch(`/api/students/${id}`);
  const d = await r.json();
  return d.data as StudentFull & {
    enrollments: { grade: { name: string }; section: { name: string } }[];
    attendances: Attendance[]; student_grades: StudentGrade[]; behavior_reports: Behavior[];
  };
}

async function fetchDocs(entityId: string) {
  const r = await fetch(`/api/documents?entityType=student&entityId=${entityId}`);
  return ((await r.json()).data?.items ?? []) as Doc[];
}

function formatSize(b: number) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`; }
const mimeIcon = (m: string) => m.startsWith("image/") ? Image : FileText;

const SECTION_ICONS: Record<string, React.ReactNode> = {
  personal: <User className="h-4 w-4" />, guardians: <Users className="h-4 w-4" />, grades: <BookOpen className="h-4 w-4" />,
  attendance: <ClipboardCheck className="h-4 w-4" />, behavior: <AlertTriangle className="h-4 w-4" />, docs: <FileText className="h-4 w-4" />,
};
const SECTION_LABELS: Record<string, string> = {
  personal: "Datos Personales", guardians: "Tutores", grades: "Calificaciones",
  attendance: "Asistencia", behavior: "Conducta", docs: "Documentos",
};

type Props = { studentId: string; open: boolean; onClose: () => void };

export function StudentProfileModal({ studentId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docName, setDocName] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: full, isLoading, error } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: () => fetchStudent(studentId),
    enabled: open && !!studentId,
  });

  const { data: docs = [], refetch: refetchDocs } = useQuery({
    queryKey: ["documents", "student", studentId],
    queryFn: () => fetchDocs(studentId),
    enabled: open && !!studentId,
  });

  const { data: history } = useQuery({
    queryKey: ["student-history", studentId],
    queryFn: async () => {
      const r = await fetch(`/api/students/${studentId}/history`);
      return ((await r.json()).data) as HistoryData;
    },
    enabled: open && !!studentId,
  });

  const yearOptions: YearOption[] = history?.enrollments?.map(e => ({ id: e.academic_year_id, label: e.academic_year.year_label })) ?? [];

  // Filtered data for selected year
  const showHistoryYear = selectedYear && history;
  const historyAttendance: Attendance[] = showHistoryYear
    ? Object.entries(history.attendanceByYear).find(([k]) => k === selectedYear)?.[1]
      ? [{ id: "hist-pres", date: "", status: "PRESENTE" }] // placeholder; actual attendance comes from API
      : []
    : [];
  const historyBehavior: Behavior[] = showHistoryYear
    ? (history.behaviorByYear[selectedYear]?.reports ?? []).map(r => ({ id: "", type: r.type, severity: r.severity, description: r.description, created_at: r.date }))
    : [];

  // Convert history grades to StudentGrade-compatible format
  const historyGrades: StudentGrade[] = showHistoryYear
    ? Object.values(history.gradesByYear[selectedYear]?.subjects ?? {}).flatMap(s =>
        s.items.map(i => ({ id: `${s.subjectName}-${i.name}`, score: i.score?.toString() ?? null, grade_item: { id: `${s.subjectName}-${i.name}`, name: `${s.subjectName}: ${i.name}`, weight: "1" } }))
      )
    : [];

  const displayAttendances = showHistoryYear ? historyAttendance : full?.attendances ?? [];
  const displayBehavior = showHistoryYear ? historyBehavior : full?.behavior_reports ?? [];
  const displayGrades = showHistoryYear ? historyGrades : full?.student_grades ?? [];

  // Get selected year's grade + section
  const selectedEnrollment = showHistoryYear
    ? history?.enrollments.find(e => e.academic_year_id === selectedYear)
    : null;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditForm>({ resolver: zodResolver(editSchema) });

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
    await fetch(`/api/students/${studentId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["student-profile", studentId] });
    queryClient.invalidateQueries({ queryKey: ["students"] });
  }

  async function onDelete() { setDeleting(true); await fetch(`/api/students/${studentId}`, { method: "DELETE" }); onClose(); queryClient.invalidateQueries({ queryKey: ["students"] }); }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPhoto(true);
    const fd = new FormData(); fd.append("file", file); fd.append("entityType", "student"); fd.append("entityId", studentId);
    const r = await fetch("/api/documents", { method: "POST", body: fd });
    const d = await r.json();
    if (d.data?.url) {
      await fetch(`/api/students/${studentId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo_url: d.data.url }) });
      // Force refetch the student data to show the new photo
      queryClient.invalidateQueries({ queryKey: ["student-profile", studentId] });
    }
    setUploadingPhoto(false);
  }

  async function handleDocUpload() {
    const file = fileInputRef.current?.files?.[0]; if (!file) return;
    setUploadingDoc(true);
    const name = docName.trim() || file.name;
    const renamed = new File([file], name, { type: file.type });
    const fd = new FormData(); fd.append("file", renamed); fd.append("entityType", "student"); fd.append("entityId", studentId);
    await fetch("/api/documents", { method: "POST", body: fd });
    setDocName(""); if (fileInputRef.current) fileInputRef.current.value = "";
    refetchDocs(); setUploadingDoc(false);
  }

  async function deleteDoc(docId: string) { await fetch(`/api/documents/${docId}`, { method: "DELETE" }); refetchDocs(); }

  if (!open) return null;

  const F = "space-y-1.5";
  const sections = ["personal", "guardians", "grades", "attendance", "behavior", "docs"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-4xl flex flex-col rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden" style={{ height: "80vh", minHeight: "80vh", maxHeight: "80vh" }}>
        {/* --- HEADER --- */}
        <div className="shrink-0 flex items-start justify-between bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] text-white px-8 py-6">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              {full?.photo_url ? (
                <img src={full.photo_url} key={full.photo_url} className="h-20 w-20 rounded-lg object-cover border-2 border-white/30" alt="" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/15 text-white text-3xl font-bold border-2 border-white/30">
                  {full?.first_name?.[0]}{full?.last_name?.[0]}
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-[#1E3A5F] shadow hover:bg-slate-100">
                {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{full?.first_name} {full?.last_name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/80">
                {enrollment && <span>{enrollment.grade.name} {enrollment.section.name}</span>}
                {full?.document_number && <span>{full.document_type ?? ""} {full.document_number}</span>}
                {full?.birth_date && <span>Nac. {new Date(full.birth_date).toLocaleDateString("es-ES")}</span>}
                {full?.gender && <span>{full.gender === "M" ? "Masculino" : full.gender === "F" ? "Femenino" : full.gender}</span>}
                {full?.admitted_at && <span>Adm. {new Date(full.admitted_at).toLocaleDateString("es-ES")}</span>}
              </div>
              {yearOptions.length > 1 && (
                <div className="mt-2">
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="h-8 rounded-md border border-white/30 bg-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/50"
                  >
                    <option value="">Año actual</option>
                    {yearOptions.map(y => (
                      <option key={y.id} value={y.id} className="text-slate-900">{y.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {showHistoryYear && selectedEnrollment && (
                <div className="flex gap-3 mt-1 text-xs text-white/60">
                  <span>{selectedEnrollment.grade.name} {selectedEnrollment.section.name}</span>
                  <span>{selectedEnrollment.academic_year.year_label}</span>
                </div>
              )}
              <span className={`inline-flex rounded-md px-2 py-0.5 mt-2 text-xs font-semibold ${full?.is_active ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"}`}>
                {full?.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                  <Pencil className="h-4 w-4" /> Editar
                </button>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="rounded-md p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setConfirmDelete(false)} className="rounded-md px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10">No</button>
                    <button onClick={onDelete} disabled={deleting} className="rounded-md bg-red-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50">{deleting ? "..." : "Sí, eliminar"}</button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">Cancelar</button>
            )}
            <button onClick={onClose} className="rounded-md p-1.5 text-white/50 hover:text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* --- SECTION NAV --- */}
        <div className="shrink-0 flex border-b bg-slate-50 px-8 overflow-x-auto">
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeSection === s ? "border-[#1E3A5F] text-[#1E3A5F]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
              {SECTION_ICONS[s]} {SECTION_LABELS[s]}
            </button>
          ))}
          <button onClick={() => { const i = sections.indexOf(activeSection); setActiveSection(sections[(i + 1) % sections.length]!); }} className="ml-auto flex items-center gap-1 px-2 py-2.5 text-xs text-slate-400 hover:text-slate-600">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* --- CONTENT --- */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
          ) : error ? (
            <div className="text-sm text-red-600">Error al cargar</div>
          ) : full ? (
            <div className="h-full">
              {/* PERSONAL */}
              {activeSection === "personal" && (
                <div className="rounded-lg border bg-white p-6 h-full ">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="h-4 w-4 text-[#1E3A5F]" /> Datos Personales</h3>
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
                      <div className={F}><Label>Notas médicas</Label><Input {...register("medical_notes")} /></div>
                      <div className="grid gap-4 sm:grid-cols-2"><div className={F}><Label>Contacto emergencia</Label><Input {...register("emergency_contact")} /></div><div className={F}><Label>Tel. emergencia</Label><Input type="tel" {...register("emergency_phone")} /></div></div>
                      <div className="flex items-center gap-3"><input type="checkbox" {...register("is_active")} className="h-4 w-4" /><Label>Activo</Label></div>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar cambios"}</Button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      {[{ l: "Nombre", v: `${full.first_name} ${full.last_name}` }, { l: "Documento", v: full.document_number ? `${full.document_type ?? ""} ${full.document_number}` : "—" }, { l: "Fecha nacimiento", v: full.birth_date ? new Date(full.birth_date).toLocaleDateString("es-ES", { dateStyle: "long" }) : "—" }, { l: "Admitido", v: full.admitted_at ? new Date(full.admitted_at).toLocaleDateString("es-ES", { dateStyle: "long" }) : "—" }, { l: "Género", v: full.gender === "M" ? "Masculino" : full.gender === "F" ? "Femenino" : "—" }, { l: "Dirección", v: full.address || "—" }, { l: "Notas médicas", v: full.medical_notes || "—" }, { l: "Contacto emergencia", v: full.emergency_contact || "—" }, { l: "Tel. emergencia", v: full.emergency_phone || "—" }].map(r => (
                        <div key={r.l} className="flex gap-2"><span className="text-slate-400 w-36 shrink-0">{r.l}</span><span className="font-medium text-slate-900">{r.v}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* GUARDIANS */}
              {activeSection === "guardians" && (
                <div className="rounded-lg border bg-white p-6 h-full ">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-[#1E3A5F]" /> Tutores</h3>
                  <StudentGuardians studentId={studentId} editing={editing} />
                </div>
              )}

              {/* GRADES */}
              {activeSection === "grades" && (
                <div className="rounded-lg border bg-white p-6 h-full ">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#1E3A5F]" /> Calificaciones {showHistoryYear && <span className="text-xs font-normal text-slate-400">· Histórico</span>}</h3>
                  {displayGrades?.length ? (
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Chart */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase">Rendimiento por criterio</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={(()=>{const m=new Map<string,number[]>();for(const g of displayGrades){if(g.score!=null){const k=g.grade_item.name;if(!m.has(k))m.set(k,[]);m.get(k)!.push(Number(g.score))}}return[...m.entries()].map(([k,v])=>({name:k,promedio:v.reduce((a,b)=>a+b,0)/v.length}))})()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                            <XAxis dataKey="name" tick={{fontSize:10}}/>
                            <YAxis domain={[0,10]} tick={{fontSize:10}}/>
                            <Tooltip/>
                            <Bar dataKey="promedio" fill="#2563EB" radius={[4,4,0,0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* List */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase">Detalle</h4>
                        {(()=>{const m=new Map<string,StudentGrade[]>();for(const g of displayGrades){const k=g.grade_item.name;if(!m.has(k))m.set(k,[]);m.get(k)!.push(g)}return[...m.entries()]})().map(([name,grades])=>(
                          <div key={name} className="rounded-md border bg-slate-50 px-4 py-3"><p className="text-xs font-semibold text-slate-700 mb-1.5">{name}</p><div className="flex flex-wrap gap-1.5">{grades.map(g=><span key={g.id} className="inline-flex rounded border bg-white px-2 py-0.5 text-xs"><span className={`font-bold ${g.score&&Number(g.score)>=5?"text-emerald-600":"text-red-600"}`}>{g.score?Number(g.score).toFixed(1):"—"}</span></span>)}</div></div>
                        ))}
                      </div>
                    </div>
                  ) : <p className="text-sm text-slate-400">Sin calificaciones registradas.</p>}
                </div>
              )}

              {/* ATTENDANCE */}
              {activeSection === "attendance" && (
                <div className="rounded-lg border bg-white p-6 h-full ">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-[#1E3A5F]" /> Asistencia {showHistoryYear && <span className="text-xs font-normal text-slate-400">· Resumen histórico</span>}</h3>
                  {showHistoryYear && history?.attendanceByYear[selectedYear] ? (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[{label:"Presente",value:history.attendanceByYear[selectedYear].presente,color:"text-emerald-600"},{label:"Ausente",value:history.attendanceByYear[selectedYear].ausente,color:"text-red-600"},{label:"Tardanza",value:history.attendanceByYear[selectedYear].tardanza,color:"text-amber-600"}].map(s=>(
                        <div key={s.label} className="rounded-lg border bg-slate-50 p-4"><p className={`text-3xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-slate-500 mt-1">{s.label}</p></div>
                      ))}
                    </div>
                  ) : displayAttendances?.length ? (
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Pie Chart */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase">Distribución</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={[{name:"Presente",value:displayAttendances.filter(a=>a.status==="PRESENTE").length},{name:"Ausente",value:displayAttendances.filter(a=>a.status==="AUSENTE").length},{name:"Tardanza",value:displayAttendances.filter(a=>a.status==="TARDANZA").length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${((percent??0)*100).toFixed(0)}%`}>
                              <Cell fill="#059669"/><Cell fill="#DC2626"/><Cell fill="#D97706"/>
                            </Pie>
                            <Tooltip/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* List */}
                      <div className="space-y-1 overflow-y-auto max-h-[250px]">
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase">Historial</h4>
                        {displayAttendances.slice(0,30).map(a=>(<div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"><span>{new Date(a.date).toLocaleDateString("es-ES",{dateStyle:"long"})}</span><span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${a.status==="PRESENTE"?"bg-emerald-50 text-emerald-700":a.status==="AUSENTE"?"bg-red-50 text-red-700":a.status==="TARDANZA"?"bg-amber-50 text-amber-700":"bg-blue-50 text-blue-700"}`}>{a.status}</span></div>))}
                      </div>
                    </div>
                  ) : <p className="text-sm text-slate-400">Sin registros de asistencia.</p>}
                </div>
              )}

              {/* BEHAVIOR */}
              {activeSection === "behavior" && (
                <div className="rounded-lg border bg-white p-6 h-full ">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#1E3A5F]" /> Conducta {showHistoryYear && <span className="text-xs font-normal text-slate-400">· Histórico</span>}</h3>
                  {displayBehavior?.length ? (
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Chart */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase">Resumen</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={(()=>{const m=new Map<string,number>();for(const r of displayBehavior){m.set(r.type,(m.get(r.type)??0)+1)}return[...m.entries()].map(([k,v])=>({name:k,count:v}))})()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                            <XAxis dataKey="name" tick={{fontSize:10}}/>
                            <YAxis allowDecimals={false} tick={{fontSize:10}}/>
                            <Tooltip/>
                            <Bar dataKey="count" fill="#2563EB" radius={[4,4,0,0]}><Cell fill="#D97706"/><Cell fill="#DC2626"/><Cell fill="#2563EB"/><Cell fill="#059669"/></Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* List */}
                      <div className="space-y-2 overflow-y-auto max-h-[250px]">
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase">Historial</h4>
                        {displayBehavior.map(r=>(<div key={r.id} className="rounded-md border bg-slate-50 px-4 py-3"><div className="flex items-center gap-2 mb-1"><span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${r.severity==="GRAVE"?"bg-red-50 text-red-700":r.severity==="MODERADO"?"bg-amber-50 text-amber-700":"bg-blue-50 text-blue-700"}`}>{r.type}</span><span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString("es-ES",{dateStyle:"long"})}</span></div><p className="text-sm text-slate-600">{r.description}</p></div>))}
                      </div>
                    </div>
                  ) : <p className="text-sm text-slate-400">Sin reportes de conducta.</p>}
                </div>
              )}

              {/* DOCUMENTS */}
              {activeSection === "docs" && (
                <div className="rounded-lg border bg-white p-6 h-full ">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-[#1E3A5F]" /> Documentos</h3>
                  <div className="space-y-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1.5"><Label>Nombre del documento</Label><Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Ej: DNI frente, Certificado médico..." /></div>
                      <div className="space-y-1.5">
                        <Label>Archivo</Label>
                        <div className="flex gap-2">
                          <input ref={fileInputRef} type="file" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#1E3A5F] file:px-3 file:py-1 file:text-xs file:font-medium file:text-white" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                          <Button onClick={handleDocUpload} disabled={!fileInputRef.current?.files?.[0] || uploadingDoc} className="gap-1 shrink-0">{uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir</Button>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      {docs.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">Sin documentos. Sube DNI, fotos, certificados médicos.</p>
                      ) : (
                        <div className="space-y-2">
                          {docs.map(doc => {
                            const Icon = mimeIcon(doc.mime_type);
                            return (
                              <div key={doc.id} className="flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3 hover:border-slate-300 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <Icon className="h-5 w-5 shrink-0 text-slate-400" />
                                  <div className="min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{doc.original_name}</p><p className="text-xs text-slate-400">{formatSize(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString("es-ES")}</p></div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-3">
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-slate-400 hover:text-[#2563EB] hover:bg-slate-50" title="Descargar"><Download className="h-4 w-4" /></a>
                                  <button onClick={() => deleteDoc(doc.id)} className="rounded-md p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* --- FOOTER --- */}
        <div className="shrink-0 border-t bg-slate-50 px-8 py-3 text-xs text-slate-400 flex items-center justify-between">
          <span>Expediente #{studentId?.slice(0, 8)}</span>
          <span>Insti ERP</span>
        </div>
      </div>
    </div>
  );
}
