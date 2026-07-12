import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js configuration. Contains NO database or bcrypt imports so it
 * can run inside Next.js middleware (Edge runtime). The Credentials provider
 * with its Node-only `authorize` lives in `auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      // Public routes that never require a session.
      const isPublic =
        pathname === "/login" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/jobs");
      if (isPublic) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: Role;
          departmentId: string | null;
          organizationId: string;
          avatarUrl?: string | null;
        };
        token.id = u.id;
        token.role = u.role;
        token.departmentId = u.departmentId;
        token.organizationId = u.organizationId;
        token.avatarUrl = u.avatarUrl ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const t = token as {
          id: string;
          role: Role;
          departmentId: string | null;
          organizationId: string;
          avatarUrl: string | null;
        };
        session.user.id = t.id;
        session.user.role = t.role;
        session.user.departmentId = t.departmentId;
        session.user.organizationId = t.organizationId;
        session.user.avatarUrl = t.avatarUrl;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
