import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.SUBJECTS_READ);
  const items = await db.subjects.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, orderBy: { name: "asc" } });
  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.SUBJECTS_WRITE);
  const body = await request.json();
  if (!body.name) return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 });
  const subject = await db.subjects.create({ data: { name: body.name, code: body.code, description: body.description, school_id: ctx.schoolId } });
  return NextResponse.json({ success: true, data: subject }, { status: 201 });
}
