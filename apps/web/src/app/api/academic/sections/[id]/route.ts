import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const section = await db.sections.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.capacity != null ? { capacity: body.capacity } : {}),
      },
    });
    return NextResponse.json({ success: true, data: section });
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
    await db.sections.update({ where: { id }, data: { deleted_at: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
