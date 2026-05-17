"use client";

import { useState } from "react";
import { AdmissionCreateModal } from "@/modules/admissions/admission-create-modal";

export function NewAdmissionButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nueva admisión</button>
      <AdmissionCreateModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
