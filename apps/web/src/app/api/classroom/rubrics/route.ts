import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.ASSIGNMENTS_READ);
  const items = await db.rubrics.findMany({ where: { school_id: ctx.schoolId, deleted_at: null }, orderBy: { created_at: "desc" } });
  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.ASSIGNMENTS_WRITE);
    const { name, criteria, subject_id } = await request.json();
    if (!name || !criteria) return NextResponse.json({ error: "name y criteria requeridos" }, { status: 400 });

    const rubric = await db.rubrics.create({
      data: { school_id: ctx.schoolId, subject_id: subject_id || null, name, criteria },
    });

    return NextResponse.json({ success: true, data: rubric }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
