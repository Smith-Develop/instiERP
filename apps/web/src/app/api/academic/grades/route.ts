import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SETTINGS_READ);
    const body = await request.json();
    if (!body.name || !body.academic_level_id) return NextResponse.json({ success: false, error: "Nombre y nivel requeridos" }, { status: 400 });
    const grade = await db.grades.create({
      data: { name: body.name, academic_level_id: body.academic_level_id, school_id: ctx.schoolId },
    });
    return NextResponse.json({ success: true, data: grade }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
