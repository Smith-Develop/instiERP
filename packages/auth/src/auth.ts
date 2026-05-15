import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@insti/database";
import type { Role } from "./roles";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [nextCookies()],
});

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  expires: Date;
};

export async function getSession(
  headers: Headers,
): Promise<AuthSession | null> {
  const session = await auth.api.getSession({
    headers,
  });

  if (session?.user) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as Record<string, unknown>).role as Role,
        image: session.user.image,
      },
      expires: session.session.expiresAt,
    };
  }

  return null;
}
