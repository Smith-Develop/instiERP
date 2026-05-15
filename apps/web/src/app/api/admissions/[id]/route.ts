import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const admission = await db.admissions.findUnique({
      where: { id, deleted_at: null },
    });

    if (!admission) {
      return NextResponse.json({ success: false, error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: admission });
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

    const admission = await db.admissions.update({
      where: { id },
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        document_type: body.document_type,
        document_number: body.document_number,
        birth_date: body.birth_date ? new Date(body.birth_date) : undefined,
        notes: body.notes,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, data: admission });
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
    await db.admissions.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
