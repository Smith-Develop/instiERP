"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AcademicLevelModal } from "@/modules/academic/academic-level-modal";
import { AcademicGradeModal } from "@/modules/academic/academic-grade-modal";
import { AcademicSectionModal } from "@/modules/academic/academic-section-modal";
import { SectionStudentsModal } from "@/modules/academic/section-students-modal";

type Section = { id: string; name: string; capacity: number };
type Grade = { id: string; name: string; sections: Section[] };
type Level = { id: string; name: string; grades: Grade[] };

export function AcademicView({ levels: initialLevels }: { levels: Level[] }) {
  const queryClient = useQueryClient();

  const [levelModal, setLevelModal] = useState<{ open: boolean; editId?: string; editName?: string }>({ open: false });
  const [gradeModal, setGradeModal] = useState<{ open: boolean; levelId: string; editId?: string; editName?: string }>({ open: false, levelId: "" });
  const [sectionModal, setSectionModal] = useState<{ open: boolean; gradeId: string; gradeName: string; editId?: string; editName?: string; editCapacity?: number }>({ open: false, gradeId: "", gradeName: "" });
  const [studentsModal, setStudentsModal] = useState<{ open: boolean; sectionId: string; sectionName: string }>({ open: false, sectionId: "", sectionName: "" });

  const deleteLevelMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/academic/levels/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const deleteGradeMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/academic/grades/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const deleteSectionMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/academic/sections/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Niveles</h2><p className="text-sm text-slate-500">{initialLevels.length} niveles</p></div>
        <button onClick={() => setLevelModal({ open: true })} className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A] transition-colors"><Plus className="h-4 w-4" /> Nuevo nivel</button>
      </div>

      {initialLevels.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-12">No hay niveles configurados. Crea Primaria, Secundaria, etc.</p>
      ) : (
        <div className="space-y-4">
          {initialLevels.map(level => (
            <div key={level.id} className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b bg-slate-50 px-6 py-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{level.name}</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => setLevelModal({ open: true, editId: level.id, editName: level.name })} className="rounded p-1.5 text-slate-400 hover:text-[#2563EB] hover:bg-white" title="Editar nivel"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (confirm(`¿Eliminar "${level.name}"?`)) deleteLevelMut.mutate(level.id); }} className="rounded p-1.5 text-slate-400 hover:text-red-600 hover:bg-white" title="Eliminar nivel"><Trash2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setGradeModal({ open: true, levelId: level.id })} className="ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"><Plus className="h-3 w-3" /> Grado</button>
                </div>
              </div>
              <div className="p-6">
                {level.grades.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin grados. Usa &quot;+ Grado&quot; para crear 1°, 2°, etc.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {level.grades.map(grade => (
                      <div key={grade.id} className="rounded-md border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{grade.name}</h4>
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => setGradeModal({ open: true, levelId: level.id, editId: grade.id, editName: grade.name })} className="rounded p-1 text-slate-300 hover:text-[#2563EB]" title="Editar grado"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => { if (confirm(`¿Eliminar grado "${grade.name}"?`)) deleteGradeMut.mutate(grade.id); }} className="rounded p-1 text-slate-300 hover:text-red-600" title="Eliminar grado"><Trash2 className="h-3 w-3" /></button>
                            <button onClick={() => setSectionModal({ open: true, gradeId: grade.id, gradeName: grade.name })} className="rounded p-1 text-slate-300 hover:text-[#2563EB]" title="Añadir sección"><Plus className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {grade.sections.length === 0 ? (
                            <span className="text-xs text-slate-300">+ Añadir sección</span>
                          ) : (
                            grade.sections.map(section => (
                              <span key={section.id} className="group relative inline-flex rounded bg-[#1E3A5F]/10 py-4 px-6 text-xs font-medium text-[#1E3A5F] hover:bg-[#1E3A5F]/20 hover:cursor-pointer transition-colors" onClick={() => setStudentsModal({ open: true, sectionId: section.id, sectionName: `${grade.name} ${section.name}` })}>
                                {section.name}
                                <span className="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5">
                                  <button onClick={(e) => { e.stopPropagation(); setSectionModal({ open: true, gradeId: grade.id, gradeName: grade.name, editId: section.id, editName: section.name, editCapacity: section.capacity }); }} className="flex h-4 w-4 items-center justify-center rounded-full bg-white border border-slate-200 text-[#2563EB]"><Pencil className="h-2.5 w-2.5" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar sección "${section.name}"?`)) deleteSectionMut.mutate(section.id); }} className="flex h-4 w-4 items-center justify-center rounded-full bg-white border border-slate-200 text-red-500"><Trash2 className="h-2.5 w-2.5" /></button>
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {levelModal.open && <AcademicLevelModal open={true} onClose={() => setLevelModal({ open: false })} editId={levelModal.editId} editName={levelModal.editName} />}
      {gradeModal.open && <AcademicGradeModal open={true} onClose={() => setGradeModal({ open: false, levelId: "" })} academicLevelId={gradeModal.levelId} editId={gradeModal.editId} editName={gradeModal.editName} />}
      {sectionModal.open && <AcademicSectionModal open={true} onClose={() => setSectionModal({ open: false, gradeId: "", gradeName: "" })} gradeId={sectionModal.gradeId} editId={sectionModal.editId} editName={sectionModal.editName} editCapacity={sectionModal.editCapacity} />}
      {studentsModal.open && <SectionStudentsModal open={true} onClose={() => setStudentsModal({ open: false, sectionId: "", sectionName: "" })} sectionId={studentsModal.sectionId} sectionName={studentsModal.sectionName} />}
    </div>
  );
}
