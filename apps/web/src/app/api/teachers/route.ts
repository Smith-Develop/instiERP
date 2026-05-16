import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.TEACHERS_READ);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

    const where = {
      school_id: ctx.schoolId,
      deleted_at: null,
    };

    const [items, total] = await Promise.all([
      db.teachers.findMany({
        where,
        include: {
          teacher_assignments: {
            where: { deleted_at: null },
            include: { subject: true, grade: true, section: true },
          },
        },
        orderBy: { last_name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.teachers.count({ where }),
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

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.TEACHERS_WRITE);
    const body = await request.json();

    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { success: false, error: "Nombre y apellidos son requeridos" },
        { status: 400 },
      );
    }

    const teacher = await db.teachers.create({
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        specialties: body.specialties ?? null,
        school_id: ctx.schoolId,
      },
    });

    return NextResponse.json({ success: true, data: teacher }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
