import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { AIPredictionsView } from "@/modules/ai/ai-predictions-view";

type Prediction = { risk_score: number; risk_level: string; factors: { name: string; impact: number }[]; recommendation: string };

export default async function AIPredictionsPage() {
  const ctx = await getSessionContext();

  const sections = await db.sections.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { grade: true },
    orderBy: [{ grade: { sort_order: "asc" } }, { sort_order: "asc" }],
  });

  // Get existing predictions from last 24h
  const cutoff = new Date(Date.now() - 24 * 3600000);
  const existingLogs = await db.ai_logs.findMany({
    where: { school_id: ctx.schoolId, feature: "prediction", created_at: { gte: cutoff } },
    orderBy: { created_at: "desc" },
  });

  const predictions = new Map<string, Prediction>();
  for (const log of existingLogs) {
    try { predictions.set(log.entity_id, JSON.parse(log.response) as Prediction); } catch {}
  }

  return <AIPredictionsView sections={sections.map(s => ({ id: s.id, label: `${s.grade.name} ${s.name}` }))} existingPredictions={predictions} />;
}
