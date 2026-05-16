"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Button } from "@insti/ui";
import { Brain, Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";

type SectionOption = { id: string; label: string };
type Prediction = { risk_score: number; risk_level: string; factors: { name: string; impact: number }[]; recommendation: string };
type Props = { sections: SectionOption[]; existingPredictions: Map<string, Prediction> };

async function predictSection(sectionId: string) {
  const res = await fetch("/api/ai/predict/section", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId }) });
  if (!res.ok) throw new Error("Error");
  return res.json() as Promise<{ data: { results: (Prediction & { studentId: string; studentName: string; cached: boolean })[] } }>;
}

const riskBadge = (level: string) => {
  switch (level) {
    case "BAJO": return { color: "bg-emerald-50 text-emerald-700", icon: TrendingDown };
    case "MEDIO": return { color: "bg-amber-50 text-amber-700", icon: Minus };
    default: return { color: "bg-red-50 text-red-700", icon: TrendingUp };
  }
};

export function AIPredictionsView({ sections, existingPredictions }: Props) {
  const [results, setResults] = useState<{ studentId: string; studentName: string; risk_score: number; risk_level: string; factors: { name: string; impact: number }[]; recommendation: string; cached: boolean }[]>([]);
  const [selectedSection, setSelectedSection] = useState(sections[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPrediction() {
    setLoading(true); setError(""); setResults([]);
    try {
      const data = await predictSection(selectedSection);
      setResults(data.data.results);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }

  // Show existing predictions if available
  const existingArr = [...existingPredictions.entries()];
  const showExisting = results.length === 0 && existingArr.length > 0;

  const displayResults = showExisting
    ? existingArr.map(([studentId, pred]) => ({ studentId, studentName: studentId.slice(0, 8), ...pred, cached: true, factors: (pred.factors as { name: string; impact: number }[]) ?? [] }))
    : results;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">IA — Predicción de Riesgo</h2><p className="text-sm text-slate-500">Analiza estudiantes con IA para detectar riesgo académico</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Sección</label><select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="flex h-10 w-full min-w-[220px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">{sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            <Button onClick={runPrediction} disabled={loading || !selectedSection}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Brain className="h-4 w-4"/>}
              {loading ? "Analizando..." : "Predecir riesgo"}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {displayResults.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Resultados {showExisting ? "(últimas 24h)" : ""}</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200">
              <table className="w-full">
                <thead><tr className="border-b bg-slate-50">{["Estudiante","Riesgo","Nivel","Factores","Recomendación"].map(h => <th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}</tr></thead>
                <tbody>
                  {displayResults.map(r => {
                    const badge = riskBadge(r.risk_level);
                    const Icon = badge.icon;
                    return (
                      <tr key={r.studentId} className="border-b hover:bg-slate-50">
                        <td className="p-4 text-sm font-medium">{r.studentName}</td>
                        <td className="p-4"><span className="text-sm font-bold">{r.risk_score}%</span></td>
                        <td className="p-4"><span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${badge.color}`}><Icon className="h-3 w-3"/>{r.risk_level}</span></td>
                        <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">{r.factors?.map(f => f.name).join(", ") || "—"}</td>
                        <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">{r.recommendation ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {showExisting && <p className="mt-2 text-xs text-slate-400">Mostrando predicciones cacheadas (24h). Ejecuta una nueva predicción para datos frescos.</p>}
          </CardContent>
        </Card>
      )}

      {!showExisting && results.length === 0 && !loading && (
        <Card><CardContent className="py-8 text-center text-sm text-slate-400">Selecciona una sección y haz clic en "Predecir riesgo" para analizar con IA.</CardContent></Card>
      )}
    </div>
  );
}
