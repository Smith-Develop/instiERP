import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SETTINGS_READ);
    const items = await db.academic_levels.findMany({
      where: { school_id: ctx.schoolId, deleted_at: null },
      orderBy: { sort_order: "asc" },
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
    guard(ctx, PERMISSIONS.SETTINGS_READ);
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 });
    const level = await db.academic_levels.create({
      data: { name: body.name, school_id: ctx.schoolId },
    });
    return NextResponse.json({ success: true, data: level }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
