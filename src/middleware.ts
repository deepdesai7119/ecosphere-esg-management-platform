import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

// Edge-safe auth built only from the DB-free config. The `authorized` callback
// redirects unauthenticated requests to /login. Fine-grained, capability-level
// checks are enforced server-side in layouts, services and route handlers.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    // Run on everything except Next internals, static assets and files with extensions.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
