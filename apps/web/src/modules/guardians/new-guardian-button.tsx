"use client";
import { useState } from "react";
import { GuardianCreateModal } from "@/modules/guardians/guardian-create-modal";

export function NewGuardianButton() {
  const [open, setOpen] = useState(false);
  return (<><button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nuevo tutor</button><GuardianCreateModal open={open} onClose={()=>setOpen(false)}/></>);
}
