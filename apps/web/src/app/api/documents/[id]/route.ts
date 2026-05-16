import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";
import { deleteDocument } from "@/lib/storage";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.STUDENTS_WRITE);
    const { id } = await params;

    const doc = await db.documents.findUnique({ where: { id, school_id: ctx.schoolId } });
    if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Delete from storage
    await deleteDocument(doc.filename).catch(() => {});

    // Soft delete from DB
    await db.documents.update({ where: { id }, data: { deleted_at: new Date() } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
