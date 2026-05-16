import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";
import { getActiveProvider, generateWithGemini, getCachedPrediction } from "@/lib/ai/gemini";

async function predictStudent(schoolId: string, studentId: string, provider: { api_key: string; models: unknown }, model: string, systemPrompt: string | null, riskThreshold: number) {
  // Check cache
  const cached = await getCachedPrediction(schoolId, "student", studentId);
  if (cached) return JSON.parse(cached.response);

  // Gather data
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const [student, grades, attendance, behavior, submissions, invoices] = await Promise.all([
    db.students.findUnique({ where: { id: studentId }, select: { first_name: true, last_name: true } }),
    db.student_grades.findMany({ where: { student_id: studentId, updated_at: { gte: monthAgo }, deleted_at: null } }),
    db.attendances.findMany({ where: { student_id: studentId, date: { gte: monthAgo }, deleted_at: null } }),
    db.behavior_reports.findMany({ where: { student_id: studentId, created_at: { gte: new Date(now.getTime() - 60 * 86400000) }, deleted_at: null } }),
    db.classroom_submissions.findMany({ where: { student_id: studentId, status: "PENDIENTE", deleted_at: null } }),
    db.invoices.findMany({ where: { student_id: studentId, status: "PENDIENTE", deleted_at: null } }),
  ]);

  if (!student) throw new Error("Estudiante no encontrado");

  const avgScore = grades.length > 0 ? grades.reduce((s, g) => s + (g.score ? Number(g.score) : 0), 0) / grades.filter(g => g.score != null).length || 0 : 0;
  const attendanceTotal = attendance.length;
  const presentCount = attendance.filter(a => a.status === "PRESENTE").length;
  const attendancePct = attendanceTotal > 0 ? Math.round((presentCount / attendanceTotal) * 100) : 100;
  const behaviorCount = behavior.length;
  const pendingSubmissions = submissions.length;
  const pendingInvoices = invoices.length;

  const userPrompt = `Analiza el riesgo académico de este estudiante:
- Nombre: ${student.first_name} ${student.last_name}
- Promedio de notas (30d): ${avgScore.toFixed(1)}/10
- Asistencia (30d): ${attendancePct}%
- Reportes de conducta (60d): ${behaviorCount}
- Tareas pendientes: ${pendingSubmissions}
- Facturas pendientes: ${pendingInvoices}
- Umbral de riesgo configurado: ${riskThreshold}

Responde SOLO en JSON: { "risk_score": number (0-100), "risk_level": "BAJO"|"MEDIO"|"ALTO", "factors": [{ "name": string, "impact": number }], "recommendation": string }`;

  const { text, tokensUsed } = await generateWithGemini(provider, model, systemPrompt, userPrompt);

  // Parse response
  let result;
  try {
    // Clean markdown code blocks if present
    const clean = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    result = JSON.parse(clean);
  } catch {
    result = { risk_score: 50, risk_level: "MEDIO", factors: [], recommendation: "No se pudo analizar" };
  }

  // Log
  await db.ai_logs.create({
    data: {
      school_id: schoolId, entity_type: "student", entity_id: studentId,
      provider: "gemini", model, feature: "prediction",
      prompt: userPrompt, response: JSON.stringify(result), tokens_used: tokensUsed,
    },
  });

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.AI_READ);

    const { studentId } = await request.json();
    if (!studentId) return NextResponse.json({ error: "studentId requerido" }, { status: 400 });

    // Check tokens
    const config = await getActiveProvider(ctx.schoolId);
    if (config.config && config.config.tokens_used >= config.config.max_tokens_per_month) {
      return NextResponse.json({ error: "Límite de tokens mensual alcanzado" }, { status: 429 });
    }

    const models = (config.provider.models as { value: string }[]) ?? [];
    const model = (config.config?.model ?? models[0]?.value ?? "gemini-2.0-flash") as string;

    const result = await predictStudent(
      ctx.schoolId, studentId,
      config.provider as { api_key: string; models: unknown },
      model,
      config.config?.system_prompt ?? null,
      config.config?.risk_threshold ? Number(config.config.risk_threshold) : 0.7,
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
