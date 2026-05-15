import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth", "/_next", "/favicon"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check session cookie set by Better Auth
  const sessionToken = request.cookies.get("better-auth.session_token");
  if (!sessionToken?.value || sessionToken.value.length < 10) {
    return redirectToLogin(request);
  }

  // Validate session by calling the auth API
  try {
    const baseUrl = request.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: {
        cookie: `better-auth.session_token=${sessionToken.value}${request.cookies.get("better-auth.session_data")?.value ? `; better-auth.session_data=${request.cookies.get("better-auth.session_data")!.value}` : ""}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return redirectToLogin(request);
    }

    const data = await res.json();
    if (!data?.user) {
      return redirectToLogin(request);
    }

    // Session valid — allow request
    return NextResponse.next();
  } catch {
    // On error, allow request (fail open for dev, auth.ts will enforce at route level)
    return NextResponse.next();
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
