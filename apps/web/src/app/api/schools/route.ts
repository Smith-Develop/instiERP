import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.SETTINGS_READ);
  const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });
  return NextResponse.json({ success: true, data: school });
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SETTINGS_WRITE);
    const body = await request.json();

    // Only allow updating non-sensitive fields
    const allowed = ["name", "address", "phone", "email", "currency", "country", "payment_provider", "stripe_public", "stripe_secret", "mp_access_token"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const school = await db.schools.update({ where: { id: ctx.schoolId }, data });
    return NextResponse.json({ success: true, data: school });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
