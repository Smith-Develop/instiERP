import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";
import { uploadDocument } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.STUDENTS_READ);

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType y entityId requeridos" }, { status: 400 });
  }

  const docs = await db.documents.findMany({
    where: { school_id: ctx.schoolId, entity_type: entityType, entity_id: entityId, deleted_at: null },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ success: true, data: { items: docs } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.STUDENTS_WRITE);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    if (!entityType || !entityId) return NextResponse.json({ error: "entityType y entityId requeridos" }, { status: 400 });

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 10MB)" }, { status: 400 });
    }

    const { url, filename } = await uploadDocument(file, ctx.schoolId, entityType);

    const doc = await db.documents.create({
      data: {
        school_id: ctx.schoolId,
        entity_type: entityType,
        entity_id: entityId,
        filename,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        url,
        uploaded_by: ctx.userId,
      },
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
