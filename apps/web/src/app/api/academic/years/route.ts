import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SETTINGS_READ);
    const items = await db.academic_years.findMany({
      where: { school_id: ctx.schoolId, deleted_at: null },
      orderBy: { start_date: "desc" },
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
    if (!body.year_label || !body.start_date || !body.end_date) {
      return NextResponse.json({ success: false, error: "year_label, start_date y end_date requeridos" }, { status: 400 });
    }

    // If setting as active, deactivate all others
    if (body.is_active) {
      await db.academic_years.updateMany({
        where: { school_id: ctx.schoolId, is_active: true },
        data: { is_active: false },
      });
    }

    const year = await db.academic_years.create({
      data: {
        year_label: body.year_label,
        start_date: new Date(body.start_date),
        end_date: new Date(body.end_date),
        is_active: body.is_active ?? false,
        school_id: ctx.schoolId,
      },
    });
    return NextResponse.json({ success: true, data: year }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
