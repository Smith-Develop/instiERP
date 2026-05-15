import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { studentSchema } from "@/modules/students/schemas";

// GET /api/students/[id] — read
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const student = await db.students.findUnique({
      where: { id, deleted_at: null },
      include: {
        enrollments: {
          where: { deleted_at: null },
          include: { grade: true, section: true, academic_year: true },
        },
        student_guardians: {
          where: { deleted_at: null },
          include: { guardian: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/students/[id] — update
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = studentSchema.partial().parse(body);

    const student = await db.students.update({
      where: { id },
      data: {
        ...parsed,
        birth_date: parsed.birth_date ? new Date(parsed.birth_date) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// DELETE /api/students/[id] — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.students.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
