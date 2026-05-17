import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

// GET: list student-guardian links for a student or guardian
export async function GET(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.STUDENTS_READ);
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const guardianId = searchParams.get("guardianId");

  const where: Record<string, unknown> = { deleted_at: null };
  if (studentId) where.student_id = studentId;
  else if (guardianId) where.guardian_id = guardianId;
  else return NextResponse.json({ error: "studentId o guardianId requerido" }, { status: 400 });

  const links = await db.student_guardians.findMany({
    where: where as never,
    include: { guardian: true, student: { select: { id: true, first_name: true, last_name: true } } },
  });
  return NextResponse.json({ success: true, data: { items: links } });
}

// POST: link a guardian to a student
export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.STUDENTS_WRITE);
    const { studentId, guardianId } = await request.json();
    if (!studentId || !guardianId) return NextResponse.json({ error: "studentId y guardianId requeridos" }, { status: 400 });

    const link = await db.student_guardians.upsert({
      where: { student_id_guardian_id: { student_id: studentId, guardian_id: guardianId } },
      update: { deleted_at: null },
      create: { student_id: studentId, guardian_id: guardianId },
    });
    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
