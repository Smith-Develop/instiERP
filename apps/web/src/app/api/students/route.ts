import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { studentSchema } from "@/modules/students/schemas";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";
import { auditLog } from "@/lib/audit";

// GET /api/students — list
export async function GET(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.STUDENTS_READ);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {
      school_id: ctx.schoolId,
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { document_number: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.students.findMany({
        where: where as never,
        orderBy: { last_name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.students.count({ where: where as never }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/students — create
export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.STUDENTS_WRITE);
    const body = await request.json();
    const parsed = studentSchema.parse(body);

    const student = await db.students.create({
      data: {
        ...parsed,
        birth_date: parsed.birth_date ? new Date(parsed.birth_date) : null,
        school_id: ctx.schoolId,
      },
    });

    auditLog(ctx.schoolId, ctx.userId, "CREATE", "student", student.id).catch(() => {});
    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
