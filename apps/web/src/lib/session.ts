import { cookies, headers as nextHeaders } from "next/headers";
import { auth, type AuthSession } from "@insti/auth";

/**
 * Obtiene la sesión del usuario en un Server Component de Next.js.
 * Usa las cookies y headers de la request para autenticar con Better Auth.
 */
export async function getServerSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const heads = await nextHeaders();

    // Build a plain object from headers for Better Auth
    const headersObj: Record<string, string> = {};
    heads.forEach((value, key) => {
      headersObj[key] = value;
    });

    // Build cookie header from cookie store
    const sessionToken = cookieStore.get("better-auth.session_token");
    const sessionData = cookieStore.get("better-auth.session_data");

    if (!sessionToken?.value) return null;

    // Fallback: try getting the session via the /api/auth endpoint
    // For server components we need to call the internal API
    const response = await auth.api.getSession({
      headers: new Headers({
        ...headersObj,
        cookie: `better-auth.session_token=${sessionToken.value}${sessionData ? `; better-auth.session_data=${sessionData.value}` : ""}`,
      }),
    });

    if (response?.user) {
      return {
        user: {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: (response.user as Record<string, unknown>).role as AuthSession["user"]["role"],
          image: response.user.image,
        },
        expires: response.session.expiresAt,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Helper que requiere autenticación. Lanza redirect a /login si no hay sesión.
 */
export async function requireServerSession(): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session) {
    // Will be caught by middleware, but safety fallback
    throw new Error("No autorizado");
  }
  return session;
}
