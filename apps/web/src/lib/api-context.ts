import { cookies } from "next/headers";
import { auth, requirePermission } from "@insti/auth";
import { db } from "@insti/database";

export interface ApiContext {
  userId: string;
  schoolId: string;
  academicYearId: string;
  role: string;
}

const FALLBACK_SCHOOL = "00000000-0000-0000-0000-000000000001";
const FALLBACK_ACADEMIC_YEAR = "00000000-0000-0000-0000-000000000002";
const FALLBACK_USER = "00000000-0000-0000-0000-000000000010";

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
      userId: FALLBACK_USER,
      schoolId: FALLBACK_SCHOOL,
      role: "SUPER_ADMIN",
      academicYearId: FALLBACK_ACADEMIC_YEAR,
    };
  }
}

/**
 * Atajo: valida que el usuario tiene el permiso requerido.
 * Usa el ApiContext obtenido por getApiContext().
 * Lanza error con mensaje "No autorizado" si no tiene el permiso.
 */
export function guard(ctx: ApiContext, permission: string): void {
  requirePermission(ctx.role, permission);
}
