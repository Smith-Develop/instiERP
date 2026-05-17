"use client";

import { useState } from "react";
import { GuardianProfileModal } from "@/modules/guardians/guardian-profile-modal";

type Guardian = { id: string; first_name: string; last_name: string; relationship: string | null; phone: string | null; email: string | null };

export function GuardianTable({ guardians }: { guardians: Guardian[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead><tr className="border-b bg-slate-50">{["Tutor","Parentesco","Teléfono","Email",""].map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
        <tbody>
          {guardians.length===0?<tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">No hay tutores</td></tr>:
            guardians.map(g=>(<tr key={g.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={()=>setSelectedId(g.id)}>
              <td className="p-4 font-medium text-slate-900">{g.last_name}, {g.first_name}</td>
              <td className="p-4 text-sm text-slate-500">{g.relationship??"—"}</td>
              <td className="p-4 text-sm text-slate-500">{g.phone??"—"}</td>
              <td className="p-4 text-sm text-slate-500">{g.email??"—"}</td>
              <td className="p-4 text-right"><button onClick={(e)=>{e.stopPropagation();setSelectedId(g.id)}} className="text-sm text-[#2563EB] hover:underline">Ver</button></td>
            </tr>))
          }
        </tbody>
      </table>
      {selectedId && <GuardianProfileModal guardianId={selectedId} open={true} onClose={()=>setSelectedId(null)}/>}
    </div>
  );
}
