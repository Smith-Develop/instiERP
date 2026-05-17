"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Loader2, Check, Plus } from "lucide-react";

type SectionOption = { id: string; label: string; gradeId: string };
type SubjectOption = { id: string; name: string };
type GradeItem = { id: string; name: string; weight: number };
type StudentGrade = {
  studentId: string;
  studentName: string;
  gradeItemId: string;
  score: string;
  gradeId?: string;
};

type Props = {
  sections: SectionOption[];
  subjects: SubjectOption[];
  schoolId: string;
  academicYearId: string;
};

export function GradesSheet({ sections, subjects, schoolId, academicYearId }: Props) {
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string>("");
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [periods, setPeriods] = useState<{ code: string; name: string }[]>([]);

  const selectedSection = sections.find((s) => s.id === sectionId);

  // Load periods
  useEffect(() => {
    fetch("/api/academic/periods")
      .then(r => r.json())
      .then(d => { if (d.data?.items) setPeriods(d.data.items.map((p: { code: string; name: string }) => ({ code: p.code, name: p.name }))); })
      .catch(() => {});
  }, []);

  const defaultPeriod = periods.length > 0 ? (periods[0]?.code ?? "TRIMESTRE_1") : "TRIMESTRE_1";

  // Load grade items for the subject + grade
  const loadGradeItems = useCallback(async () => {
    if (!subjectId || !selectedSection) return;
    const res = await fetch(
      `/api/grades/items?subjectId=${subjectId}&gradeId=${selectedSection.gradeId}&sectionId=${sectionId}&schoolId=${schoolId}&academicYearId=${academicYearId}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    setGradeItems(data.items);
    if (data.items.length > 0 && !activeItemId) {
      setActiveItemId(data.items[0].id);
    }
  }, [subjectId, selectedSection, sectionId, schoolId, academicYearId, activeItemId]);

  useEffect(() => {
    loadGradeItems();
  }, [loadGradeItems]);

  // Load student grades for the active grade item
  const loadGrades = useCallback(async () => {
    if (!sectionId || !activeItemId) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/grades?sectionId=${sectionId}&gradeItemId=${activeItemId}&academicYearId=${academicYearId}`,
      );
      if (!res.ok) throw new Error("Error al cargar notas");
      const data = await res.json();
      setStudentGrades(data.grades);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [sectionId, activeItemId, academicYearId]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  function updateScore(studentId: string, gradeItemId: string, value: string) {
    if (value !== "" && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 10)) return;
    setStudentGrades((prev) =>
      prev.map((g) =>
        g.studentId === studentId && g.gradeItemId === gradeItemId
          ? { ...g, score: value }
          : g,
      ),
    );
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearId,
          grades: studentGrades.map((g) => ({
            studentId: g.studentId,
            gradeItemId: g.gradeItemId,
            score: g.score ? Number(g.score) : null,
            gradeId: g.gradeId,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function addGradeItem() {
    const name = prompt("Nombre del criterio (ej: Exámenes, Tareas):");
    if (!name) return;
    const weight = prompt("Peso (ej: 0.6 para 60%, 0.3 para 30%):", "0.3");
    if (!weight) return;

    const res = await fetch("/api/grades/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        gradeId: selectedSection!.gradeId,
        sectionId,
        schoolId,
        academicYearId,
        name,
        weight: Number(weight),
        period: defaultPeriod,
      }),
    });

    if (res.ok) {
      await loadGradeItems();
      // Select the new item after reload
      const data = await res.json();
      if (data.item) setActiveItemId(data.item.id);
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sección</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="flex h-10 w-full min-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Asignatura</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="flex h-10 w-full min-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Items tabs */}
      {gradeItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {gradeItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveItemId(item.id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeItemId === item.id
                  ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.name}
              <span className="text-xs opacity-70">({Math.round(item.weight * 100)}%)</span>
            </button>
          ))}
          <button
            onClick={addGradeItem}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-600"
          >
            <Plus className="h-3.5 w-3.5" /> Criterio
          </button>
        </div>
      )}

      {/* Student grades table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {gradeItems.find((g) => g.id === activeItemId)?.name ?? "Notas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : studentGrades.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Selecciona un criterio de evaluación para ver las notas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Estudiante
                    </th>
                    <th className="py-3 text-right text-xs font-medium uppercase text-slate-500 w-32">
                      Nota (0-10)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentGrades.map((grade) => (
                    <tr key={grade.studentId} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 text-sm font-medium text-slate-900">
                        {grade.studentName}
                      </td>
                      <td className="py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={grade.score}
                          onChange={(e) =>
                            updateScore(grade.studentId, grade.gradeItemId, e.target.value)
                          }
                          className="h-9 w-20 rounded-md border border-slate-200 px-2 text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                          placeholder="—"
                          style={{ touchAction: "manipulation" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {studentGrades.length > 0 && (
          <CardFooter className="flex gap-3 border-t pt-6">
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" /> Guardado
                </>
              ) : (
                "Guardar notas"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
