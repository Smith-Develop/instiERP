import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.BEHAVIOR_WRITE);
    const body = await request.json();

    if (!body.student_id || !body.description) {
      return NextResponse.json({ error: "student_id y description requeridos" }, { status: 400 });
    }

    const report = await db.behavior_reports.create({
      data: {
        school_id: ctx.schoolId,
        academic_year_id: ctx.academicYearId,
        student_id: body.student_id,
        type: body.type ?? "OBSERVACION",
        description: body.description,
        severity: body.severity ?? "LEVE",
        reported_by: ctx.userId,
      },
    });

    // Notify parent if student has guardians
    const guardians = await db.student_guardians.findMany({
      where: { student_id: body.student_id, deleted_at: null },
      include: { guardian: { select: { user_id: true } } },
    });
    const studentName = await db.students.findUnique({ where: { id: body.student_id }, select: { first_name: true } });
    for (const g of guardians) {
      if (g.guardian.user_id) {
        await db.notifications.create({
          data: {
            user_id: g.guardian.user_id,
            title: `Nuevo reporte: ${body.type ?? "Observación"}`,
            content: `${studentName?.first_name ?? "Estudiante"}: ${body.description.slice(0, 150)}`,
            type: body.severity === "GRAVE" ? "WARNING" : "INFO",
            link: "/dashboard/behavior",
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
