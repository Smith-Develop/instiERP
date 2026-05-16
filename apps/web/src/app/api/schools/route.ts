import { NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.SETTINGS_READ);
  const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });
  return NextResponse.json({ success: true, data: school });
}
