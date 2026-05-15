import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const teacher = await db.teachers.findUnique({
      where: { id, deleted_at: null },
      include: {
        teacher_assignments: {
          where: { deleted_at: null },
          include: { subject: true, grade: true, section: true },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: teacher });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const teacher = await db.teachers.update({
      where: { id },
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        specialties: body.specialties,
        is_active: body.is_active,
      },
    });

    return NextResponse.json({ success: true, data: teacher });
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
    await db.teachers.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
