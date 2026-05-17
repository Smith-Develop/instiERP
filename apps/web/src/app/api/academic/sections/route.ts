import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function GET() {
  const ctx = await getApiContext();
  const sections = await db.sections.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { grade: true },
    orderBy: [{ grade: { sort_order: "asc" } }, { sort_order: "asc" }],
  });
  return NextResponse.json({
    success: true,
    data: sections.map(s => ({ id: s.id, label: `${s.grade.name} ${s.name}`, gradeId: s.grade_id, gradeName: s.grade.name })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    const body = await request.json();
    if (!body.name || !body.grade_id) return NextResponse.json({ success: false, error: "Nombre y grado requeridos" }, { status: 400 });
    const section = await db.sections.create({
      data: { name: body.name, grade_id: body.grade_id, school_id: ctx.schoolId, capacity: body.capacity ?? 30 },
      include: { grade: true },
    });
    return NextResponse.json({ success: true, data: section }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
