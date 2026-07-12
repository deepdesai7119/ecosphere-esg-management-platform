import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./config";
import { prisma } from "@/lib/db";

const credentialsSchema = {
  parse(raw: unknown): { email: string; password: string } | null {
    if (!raw || typeof raw !== "object") return null;
    const { email, password } = raw as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string") return null;
    if (!email.includes("@") || password.length < 1) return null;
    return { email: email.toLowerCase().trim(), password };
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const creds = credentialsSchema.parse(raw);
        if (!creds) return null;

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
        });
        if (!user || user.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(creds.password, user.passwordHash);
        if (!valid) return null;

        // Best-effort last-login stamp; never block sign-in on it.
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => undefined);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          organizationId: user.organizationId,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
});
