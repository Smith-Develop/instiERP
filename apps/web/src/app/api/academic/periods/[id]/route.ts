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
    const period = await db.academic_periods.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.code ? { code: body.code } : {}),
        ...(body.sort_order != null ? { sort_order: body.sort_order } : {}),
        ...(body.start_date !== undefined ? { start_date: body.start_date ? new Date(body.start_date) : null } : {}),
        ...(body.end_date !== undefined ? { end_date: body.end_date ? new Date(body.end_date) : null } : {}),
      },
    });
    return NextResponse.json({ success: true, data: period });
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
    await db.academic_periods.update({ where: { id }, data: { deleted_at: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
