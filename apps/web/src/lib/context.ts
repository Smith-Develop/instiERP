import { db } from "@insti/database";
import { getServerSession } from "./session";

export interface SessionContext {
  userId: string;
  schoolId: string;
  schoolName: string;
  academicYearId: string;
  role: string;
}

const FALLBACK_SCHOOL = "00000000-0000-0000-0000-000000000001";
const FALLBACK_ACADEMIC_YEAR = "00000000-0000-0000-0000-000000000002";
const FALLBACK_USER = "00000000-0000-0000-0000-000000000010";

/**
 * Obtiene el contexto de sesión (school, año lectivo) del usuario actual.
 * En desarrollo usa valores fallback si no hay sesión.
 */
export async function getSessionContext(): Promise<SessionContext> {
  const session = await getServerSession();

  if (!session) {
    // Fallback for dev + build time; middleware enforces auth at runtime
    return {
      userId: FALLBACK_USER,
      schoolId: FALLBACK_SCHOOL,
      schoolName: "Colegio Demo",
      academicYearId: FALLBACK_ACADEMIC_YEAR,
      role: "SUPER_ADMIN",
    };
  }

  // Get user's school from user_schools
  const userSchool = await db.user_schools.findFirst({
    where: { user_id: session.user.id, deleted_at: null },
    include: { school: true },
  });

  if (!userSchool) {
    return {
      userId: session.user.id,
      schoolId: FALLBACK_SCHOOL,
      schoolName: "Colegio Demo",
      academicYearId: FALLBACK_ACADEMIC_YEAR,
      role: session.user.role,
    };
  }

  // Get active academic year
  const academicYear = await db.academic_years.findFirst({
    where: { school_id: userSchool.school_id, is_active: true, deleted_at: null },
  });

  return {
    userId: session.user.id,
    schoolId: userSchool.school_id,
    schoolName: userSchool.school.name,
    academicYearId: academicYear?.id ?? FALLBACK_ACADEMIC_YEAR,
    role: userSchool.role,
  };
}
