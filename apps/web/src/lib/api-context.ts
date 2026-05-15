import { cookies } from "next/headers";
import { auth } from "@insti/auth";
import { db } from "@insti/database";

export interface ApiContext {
  userId: string;
  schoolId: string;
  academicYearId: string;
  role: string;
}

/**
 * Obtiene el school_id y academic_year_id del usuario autenticado desde la sesión.
 * Usa fallback de desarrollo si no hay sesión.
 */
export async function getApiContext(): Promise<ApiContext> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token");
    const sessionData = cookieStore.get("better-auth.session_data");

    if (!sessionToken?.value) {
      throw new Error("No session cookie");
    }

    const cookieHeader = `better-auth.session_token=${sessionToken.value}${sessionData ? `; better-auth.session_data=${sessionData.value}` : ""}`;

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: cookieHeader }),
    });

    if (!session?.user) {
      throw new Error("Invalid session");
    }

    const userSchool = await db.user_schools.findFirst({
      where: { user_id: session.user.id, deleted_at: null },
    });

    if (!userSchool) {
      throw new Error("User has no school");
    }

    // Get active academic year
    const academicYear = await db.academic_years.findFirst({
      where: { school_id: userSchool.school_id, is_active: true, deleted_at: null },
    });

    return {
      userId: session.user.id,
      schoolId: userSchool.school_id,
      role: userSchool.role,
      academicYearId: academicYear?.id ?? "00000000-0000-0000-0000-000000000002",
    };
  } catch {
    // Development fallback
    return {
      userId: "00000000-0000-0000-0000-000000000010",
      schoolId: "00000000-0000-0000-0000-000000000001",
      role: "SUPER_ADMIN",
      academicYearId: "00000000-0000-0000-0000-000000000002",
    };
  }
}

/** Roles autorizados para operaciones de reports */
export function requireRole(ctx: ApiContext, allowed: string[]) {
  if (!allowed.includes(ctx.role)) {
    throw new Error("No autorizado: rol insuficiente");
  }
}

const REPORT_ROLES = ["SUPER_ADMIN", "DIRECTOR", "SECRETARIA"];

export function requireReportsRole(ctx: ApiContext) {
  requireRole(ctx, REPORT_ROLES);
}
