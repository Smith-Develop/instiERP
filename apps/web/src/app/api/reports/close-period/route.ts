import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, requireReportsRole } from "@/lib/api-context";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    requireReportsRole(ctx);

    const { gradeId, sectionId, period, close } = await request.json();
    if (!gradeId || !period) {
      return NextResponse.json({ error: "gradeId y period requeridos" }, { status: 400 });
    }

    if (close) {
      await db.closed_periods.upsert({
        where: {
          school_id_academic_year_id_grade_id_section_id_period: {
            school_id: ctx.schoolId,
            academic_year_id: ctx.academicYearId,
            grade_id: gradeId,
            section_id: sectionId ?? null,
            period,
          },
        },
        update: { is_closed: true, closed_at: new Date(), closed_by: ctx.userId },
        create: {
          school_id: ctx.schoolId,
          academic_year_id: ctx.academicYearId,
          grade_id: gradeId,
          section_id: sectionId ?? null,
          period,
          is_closed: true,
          closed_by: ctx.userId,
        },
      });
    } else {
      await db.closed_periods.deleteMany({
        where: {
          school_id: ctx.schoolId,
          academic_year_id: ctx.academicYearId,
          grade_id: gradeId,
          section_id: sectionId ?? null,
          period,
        },
      });
    }

    return NextResponse.json({ success: true, closed: !!close });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: error instanceof Error && error.message.includes("No autorizado") ? 403 : 500 });
  }
}

export async function GET(request: NextRequest) {
  const ctx = await getApiContext();
  requireReportsRole(ctx);
  const { searchParams } = new URL(request.url);
  const gradeId = searchParams.get("gradeId");

  const closed = await db.closed_periods.findMany({
    where: {
      school_id: ctx.schoolId,
      academic_year_id: ctx.academicYearId,
      grade_id: gradeId ?? undefined,
    },
  });

  return NextResponse.json({ success: true, data: closed });
}
