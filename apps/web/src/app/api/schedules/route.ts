import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.SCHEDULE_READ);

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("section");

  const items = await db.schedules.findMany({
    where: {
      school_id: ctx.schoolId,
      academic_year_id: ctx.academicYearId,
      deleted_at: null,
      ...(sectionId ? { section_id: sectionId } : {}),
    },
    include: {
      teacher: { select: { first_name: true, last_name: true } },
      subject: { select: { name: true } },
      grade: { select: { name: true } },
      section: { select: { name: true } },
    },
    orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
  });

  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.TEACHERS_WRITE);
    const body = await request.json();

    if (!body.teacher_id || !body.subject_id || !body.grade_id || body.day_of_week == null || !body.start_time || !body.end_time) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const schedule = await db.schedules.create({
      data: {
        school_id: ctx.schoolId, academic_year_id: ctx.academicYearId,
        teacher_id: body.teacher_id, subject_id: body.subject_id, grade_id: body.grade_id,
        section_id: body.section_id || null,
        day_of_week: body.day_of_week, start_time: body.start_time, end_time: body.end_time,
        classroom: body.classroom || null,
      },
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
