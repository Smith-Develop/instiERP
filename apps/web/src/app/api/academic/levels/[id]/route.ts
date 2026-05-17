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
    guard(ctx, PERMISSIONS.SETTINGS_READ);
    const { id } = await params;
    const body = await request.json();
    const level = await db.academic_levels.update({
      where: { id },
      data: { name: body.name },
    });
    return NextResponse.json({ success: true, data: level });
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
    await db.academic_levels.update({ where: { id }, data: { deleted_at: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
