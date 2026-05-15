import { NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function GET() {
  const ctx = await getApiContext();
  const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });
  return NextResponse.json({ success: true, data: school });
}
