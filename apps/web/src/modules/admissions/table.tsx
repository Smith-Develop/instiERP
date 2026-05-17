"use client";

import { useState } from "react";
import { AdmissionProfileModal } from "@/modules/admissions/admission-profile-modal";

type Admission = { id: string; first_name: string; last_name: string; document_number: string | null; status: string; created_at: Date };

const STATUS_LABELS: Record<string,string> = { PENDIENTE:"Pendiente", EN_TRAMITE:"En trámite", ADMITIDO:"Admitido", NO_ADMITIDO:"No admitido", MATRICULADO:"Matriculado" };
const STATUS_COLORS: Record<string,string> = { PENDIENTE:"bg-amber-50 text-amber-700", EN_TRAMITE:"bg-blue-50 text-blue-700", ADMITIDO:"bg-emerald-50 text-emerald-700", NO_ADMITIDO:"bg-red-50 text-red-700", MATRICULADO:"bg-purple-50 text-purple-700" };

export function AdmissionTable({ admissions }: { admissions: Admission[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead><tr className="border-b bg-slate-50">{["Solicitante","Documento","Estado","Fecha",""].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
        <tbody>
          {admissions.length===0?<tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">No hay admisiones</td></tr>:
            admissions.map(a=>{
              const isNotAdmitted = a.status === "NO_ADMITIDO";
              return (
                <tr key={a.id} className={`border-b hover:bg-slate-50 cursor-pointer ${isNotAdmitted ? "bg-red-50/60" : ""}`} onClick={()=>setSelectedId(a.id)}>
                  <td className="p-4 font-medium text-slate-900">{a.last_name}, {a.first_name}</td>
                  <td className="p-4 text-sm text-slate-500">{a.document_number??"—"}</td>
                  <td className="p-4"><span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[a.status]??"bg-slate-50"}`}>{STATUS_LABELS[a.status]??a.status}</span></td>
                  <td className="p-4 text-sm text-slate-500">{new Date(a.created_at).toLocaleDateString("es-ES")}</td>
                  <td className="p-4 text-right"><button onClick={(e)=>{e.stopPropagation();setSelectedId(a.id)}} className="text-sm text-[#2563EB] hover:underline">Ver</button></td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
      {selectedId && <AdmissionProfileModal admissionId={selectedId} open={true} onClose={()=>setSelectedId(null)}/>}
    </div>
  );
}
