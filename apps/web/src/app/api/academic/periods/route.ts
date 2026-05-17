import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SETTINGS_READ);
    const items = await db.academic_periods.findMany({
      where: { school_id: ctx.schoolId, academic_year_id: ctx.academicYearId, deleted_at: null },
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SETTINGS_WRITE);
    const body = await request.json();
    if (!body.name || !body.code) return NextResponse.json({ success: false, error: "Nombre y código requeridos" }, { status: 400 });

    const period = await db.academic_periods.create({
      data: {
        name: body.name, code: body.code,
        sort_order: body.sort_order ?? 0,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        school_id: ctx.schoolId, academic_year_id: ctx.academicYearId,
      },
    });
    return NextResponse.json({ success: true, data: period }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
