"use client";

import { useState } from "react";
import { TeacherProfileModal } from "@/modules/teachers/teacher-profile-modal";

type Teacher = {
  id: string; first_name: string; last_name: string; specialties: string | null; is_active: boolean;
  teacher_assignments: { subject: { name: string }; grade: { name: string }; section: { name: string } | null }[];
};

export function TeacherTable({ teachers }: { teachers: Teacher[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead><tr className="border-b bg-slate-50">
          {["Profesor","Especialidades","Asignaciones","Estado",""].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}
        </tr></thead>
        <tbody>
          {teachers.length===0?<tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">No hay profesores</td></tr>:
            teachers.map(t=>(<tr key={t.id} className="border-b hover:bg-slate-50">
              <td className="p-4 font-medium text-slate-900 cursor-pointer" onClick={()=>setSelectedId(t.id)}>{t.last_name}, {t.first_name}</td>
              <td className="p-4 text-sm text-slate-500">{t.specialties??"—"}</td>
              <td className="p-4 text-sm text-slate-500">{t.teacher_assignments.length>0?t.teacher_assignments.map(a=>`${a.subject.name} (${a.grade.name}${a.section?.name?` ${a.section.name}`:""})`).join(", "):"—"}</td>
              <td className="p-4"><span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${t.is_active?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}>{t.is_active?"Activo":"Inactivo"}</span></td>
              <td className="p-4 text-right"><button onClick={()=>setSelectedId(t.id)} className="text-sm text-[#2563EB] hover:underline">Ver</button></td>
            </tr>))
          }
        </tbody>
      </table>
      {selectedId && <TeacherProfileModal teacherId={selectedId} open={true} onClose={()=>setSelectedId(null)}/>}
    </div>
  );
}
