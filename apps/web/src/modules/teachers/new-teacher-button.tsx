"use client";

import { useState } from "react";
import { TeacherCreateModal } from "@/modules/teachers/teacher-create-modal";

export function NewTeacherButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nuevo profesor</button>
      <TeacherCreateModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
