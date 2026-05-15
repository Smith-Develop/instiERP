import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";
import { guardianSchema } from "@/modules/guardians/schemas";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Number(searchParams.get("pageSize")) || 20);

    const where = { school_id: ctx.schoolId, deleted_at: null };

    const [items, total] = await Promise.all([
      db.guardians.findMany({
        where,
        orderBy: { last_name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.guardians.count({ where }),
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
    const body = await request.json();
    const parsed = guardianSchema.parse(body);

    const guardian = await db.guardians.create({
      data: { ...parsed, school_id: ctx.schoolId, email: parsed.email || null },
    });

    return NextResponse.json({ success: true, data: guardian }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
