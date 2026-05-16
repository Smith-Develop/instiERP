import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";
import { getActiveProvider, generateWithGemini, getCachedPrediction } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.AI_READ);
    const { sectionId } = await request.json();
    if (!sectionId) return NextResponse.json({ error: "sectionId requerido" }, { status: 400 });

    const config = await getActiveProvider(ctx.schoolId);
    if (config.config && config.config.tokens_used >= config.config.max_tokens_per_month) {
      return NextResponse.json({ error: "Límite de tokens alcanzado" }, { status: 429 });
    }

    const models = (config.provider.models as { value: string }[]) ?? [];
    const model = (config.config?.model ?? models[0]?.value ?? "gemini-2.0-flash") as string;

    const enrollments = await db.enrollments.findMany({
      where: { section_id: sectionId, academic_year_id: ctx.academicYearId, deleted_at: null, is_active: true },
      include: { student: { select: { id: true, first_name: true, last_name: true } } },
    });

    const results: { studentId: string; studentName: string; risk_score: number; risk_level: string; factors: { name: string; impact: number }[]; recommendation: string; cached: boolean }[] = [];

    for (const enr of enrollments) {
      const cached = await getCachedPrediction(ctx.schoolId, "student", enr.student.id);
      if (cached) {
        results.push({ studentId: enr.student.id, studentName: `${enr.student.last_name}, ${enr.student.first_name}`, ...JSON.parse(cached.response), cached: true });
        continue;
      }

      // Gather data
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      const [grades, attendance, behavior, submissions, invoices] = await Promise.all([
        db.student_grades.findMany({ where: { student_id: enr.student.id, updated_at: { gte: monthAgo }, deleted_at: null } }),
        db.attendances.findMany({ where: { student_id: enr.student.id, date: { gte: monthAgo }, deleted_at: null } }),
        db.behavior_reports.findMany({ where: { student_id: enr.student.id, created_at: { gte: new Date(now.getTime() - 60 * 86400000) }, deleted_at: null } }),
        db.classroom_submissions.findMany({ where: { student_id: enr.student.id, status: "PENDIENTE", deleted_at: null } }),
        db.invoices.findMany({ where: { student_id: enr.student.id, status: "PENDIENTE", deleted_at: null } }),
      ]);

      const avgScore = grades.length > 0 ? grades.reduce((s, g) => s + (g.score ? Number(g.score) : 0), 0) / grades.filter(g => g.score != null).length || 0 : 0;
      const attendancePct = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === "PRESENTE").length / attendance.length) * 100) : 100;

      const prompt = `Analiza: ${enr.student.first_name} ${enr.student.last_name}. Notas: ${avgScore.toFixed(1)}/10. Asistencia(30d): ${attendancePct}%. Conducta(60d): ${behavior.length}. Tareas pendientes: ${submissions.length}. Facturas: ${invoices.length}. Responde JSON: { risk_score(0-100), risk_level(BAJO|MEDIO|ALTO), factors:[{name,impact}], recommendation }`;

      const { text, tokensUsed } = await generateWithGemini(config.provider as { api_key: string; models: unknown }, model, config.config?.system_prompt ?? null, prompt);

      let result;
      try {
        result = JSON.parse(text.replace(/```json\n?/g, "").replace(/```/g, "").trim());
      } catch {
        result = { risk_score: 50, risk_level: "MEDIO", factors: [], recommendation: "—" };
      }

      await db.ai_logs.create({
        data: { school_id: ctx.schoolId, entity_type: "student", entity_id: enr.student.id, provider: "gemini", model, feature: "prediction", prompt, response: JSON.stringify(result), tokens_used: tokensUsed },
      });

      results.push({
        studentId: enr.student.id, studentName: `${enr.student.last_name}, ${enr.student.first_name}`,
        risk_score: result.risk_score, risk_level: result.risk_level, factors: result.factors, recommendation: result.recommendation, cached: false,
      });
    }

    // Update tokens used
    if (config.config) {
      await db.ai_configurations.update({
        where: { school_id: ctx.schoolId },
        data: { tokens_used: { increment: results.filter(r => !r.cached).length * 200 } },
      });
    }

    return NextResponse.json({ success: true, data: { results } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
