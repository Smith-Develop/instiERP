import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.ADMISSIONS_READ);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

    const where = {
      school_id: ctx.schoolId,
      deleted_at: null,
    };

    const [items, total] = await Promise.all([
      db.admissions.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.admissions.count({ where }),
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
    guard(ctx, PERMISSIONS.ADMISSIONS_WRITE);
    const body = await request.json();

    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { success: false, error: "Nombre y apellidos son requeridos" },
        { status: 400 },
      );
    }

    const admission = await db.admissions.create({
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        document_type: body.document_type ?? null,
        document_number: body.document_number ?? null,
        birth_date: body.birth_date ? new Date(body.birth_date) : null,
        gender: body.gender ?? null,
        address: body.address ?? null,
        desired_grade_id: body.desired_grade_id ?? null,
        guardian_name: body.guardian_name ?? null,
        guardian_relationship: body.guardian_relationship ?? null,
        guardian_phone: body.guardian_phone ?? null,
        guardian_email: body.guardian_email ?? null,
        medical_notes: body.medical_notes ?? null,
        emergency_contact: body.emergency_contact ?? null,
        emergency_phone: body.emergency_phone ?? null,
        notes: body.notes ?? null,
        school_id: ctx.schoolId,
        status: "PENDIENTE",
      },
    });

    return NextResponse.json({ success: true, data: admission }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
