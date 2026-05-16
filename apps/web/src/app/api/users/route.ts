import { NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.USERS_READ);

  const userSchools = await db.user_schools.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null, is_active: true },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  // Exclude current user
  const items = userSchools
    .filter((us) => us.user_id !== ctx.userId)
    .map((us) => ({
      id: us.user.id,
      name: us.user.name,
      role: us.user.role,
    }));

  return NextResponse.json({ success: true, data: { items } });
}
