"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@insti/ui";
import { Download, FileText, Loader2, Lock, Unlock } from "lucide-react";
import Link from "next/link";

type Section = { id: string; label: string; gradeId?: string };
type StudentRow = { id: string; name: string; average: number; items: { name: string; score: number | null }[] };

export function ReportsView({
  sections,
  firstSection,
  students,
}: {
  sections: Section[];
  firstSection: string | null;
  students: StudentRow[];
}) {
  const [downloadingSection, setDownloadingSection] = useState<string | null>(null);
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const [closedPeriods, setClosedPeriods] = useState<Set<string>>(new Set());
  const [closingGrade, setClosingGrade] = useState(sections[0]?.gradeId ?? sections[0]?.id ?? "");
  const [toggling, setToggling] = useState<string | null>(null);

  const loadClosedPeriods = useCallback(async () => {
    const res = await fetch(`/api/reports/close-period?gradeId=${closingGrade}`);
    const data = await res.json();
    if (data.data) {
      setClosedPeriods(new Set(data.data.map((c: { period: string }) => c.period)));
    }
  }, [closingGrade]);

  useEffect(() => { loadClosedPeriods(); }, [loadClosedPeriods]);

  async function downloadBoletin(sectionId: string) {
    setDownloadingSection(sectionId);
    try {
      const res = await fetch("/api/reports/boletin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `boletin-${sectionId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingSection(null);
    }
  }

  async function downloadCertificate(studentId: string) {
    setDownloadingCert(studentId);
    try {
      const res = await fetch("/api/reports/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado-${studentId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingCert(null);
    }
  }

  async function togglePeriodClose(period: string, close: boolean) {
    setToggling(period);
    await fetch("/api/reports/close-period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gradeId: closingGrade, period, close }),
    });
    await loadClosedPeriods();
    setToggling(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Boletines y Certificados</h2>
        <p className="text-sm text-slate-500">Genera documentos oficiales en PDF</p>
      </div>

      {/* Download Boletín by section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Descargar boletín por sección</h3>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <Button
              key={s.id}
              variant="outline"
              onClick={() => downloadBoletin(s.id)}
              disabled={downloadingSection === s.id}
              className="gap-2"
            >
              {downloadingSection === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Cierre de periodos */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Cierre de periodos</h3>
        <p className="text-sm text-slate-500 mb-4">Selecciona un grado y cierra el periodo para bloquear la edición de notas.</p>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Grado</label>
            <select
              value={closingGrade}
              onChange={(e) => setClosingGrade(e.target.value)}
              className="flex h-10 w-full min-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.gradeId ?? s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {["TRIMESTRE_1", "TRIMESTRE_2", "TRIMESTRE_3"].map((period) => {
            const checkClosed = closedPeriods.has(period);
            return (
              <Button
                key={period}
                variant={checkClosed ? "default" : "outline"}
                onClick={() => togglePeriodClose(period, !checkClosed)}
                disabled={toggling === period}
                className="gap-2"
              >
                {toggling === period ? <Loader2 className="h-4 w-4 animate-spin" /> : checkClosed ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                {period.replace("_", " ")}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Vista previa */}
      {firstSection && students.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b bg-slate-50 px-6 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Vista previa — {sections[0]?.label}</h3>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left text-xs font-medium uppercase text-slate-500">Estudiante</th>
                  {students[0]?.items.map(it => <th key={it.name} className="py-3 text-center text-xs font-medium uppercase text-slate-500">{it.name}</th>)}
                  <th className="py-3 text-center text-xs font-medium uppercase text-slate-500">Promedio</th>
                  <th className="py-3 text-center text-xs font-medium uppercase text-slate-500">Certificado</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => (
                  <tr key={st.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900 text-sm">
                      <Link href={`/dashboard/reports/${st.id}`} className="text-[#2563EB] hover:underline">{st.name}</Link>
                    </td>
                    {st.items.map(it => (
                      <td key={it.name} className="py-3 text-center text-sm">
                        {it.score !== null ? <span className={it.score >= 5 ? "text-slate-700" : "text-red-600"}>{it.score}</span> : <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                    <td className="py-3 text-center">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${st.average >= 5 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{st.average.toFixed(2)}</span>
                    </td>
                    <td className="py-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => downloadCertificate(st.id)} disabled={downloadingCert === st.id} className="gap-1">
                        {downloadingCert === st.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
