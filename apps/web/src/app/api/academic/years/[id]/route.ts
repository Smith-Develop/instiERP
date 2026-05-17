import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SETTINGS_WRITE);
    const { id } = await params;
    const body = await request.json();

    // If setting as active, deactivate all others
    if (body.is_active) {
      await db.academic_years.updateMany({
        where: { school_id: ctx.schoolId, is_active: true, id: { not: id } },
        data: { is_active: false },
      });
    }

    const year = await db.academic_years.update({
      where: { id },
      data: {
        ...(body.year_label ? { year_label: body.year_label } : {}),
        ...(body.start_date ? { start_date: new Date(body.start_date) } : {}),
        ...(body.end_date ? { end_date: new Date(body.end_date) } : {}),
        ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
      },
    });
    return NextResponse.json({ success: true, data: year });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.academic_years.update({ where: { id }, data: { deleted_at: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
