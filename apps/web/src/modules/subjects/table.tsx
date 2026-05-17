"use client";

import { useState } from "react";
import { SubjectProfileModal } from "@/modules/subjects/subject-profile-modal";

type Subject = { id: string; name: string; code: string | null; description: string | null };

export function SubjectTable({ subjects }: { subjects: Subject[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead><tr className="border-b bg-slate-50">{["Nombre","Código","Descripción",""].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
        <tbody>
          {subjects.length===0?<tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400">No hay asignaturas</td></tr>:
            subjects.map(s=>(<tr key={s.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={()=>setSelectedId(s.id)}>
              <td className="p-4 font-medium text-slate-900 text-sm">{s.name}</td>
              <td className="p-4 text-sm text-slate-500">{s.code??"—"}</td>
              <td className="p-4 text-sm text-slate-500">{s.description??"—"}</td>
              <td className="p-4 text-right"><button onClick={(e)=>{e.stopPropagation();setSelectedId(s.id)}} className="text-sm text-[#2563EB] hover:underline">Ver</button></td>
            </tr>))
          }
        </tbody>
      </table>
      {selectedId && <SubjectProfileModal subjectId={selectedId} open={true} onClose={()=>setSelectedId(null)}/>}
    </div>
  );
}
