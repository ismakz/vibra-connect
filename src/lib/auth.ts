import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // Pas d'adapter Prisma ici : Credentials + JWT n'en ont pas besoin, et
  // @auth/prisma-adapter v2 est incompatible avec next-auth v4 (erreur Configuration).
  session: { strategy: "jwt" as const },
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const email = String(credentials.email ?? "").trim().toLowerCase();
        const password = String(credentials.password ?? "");
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse({ email, password });
        if (!parsed.success) return null;

        const user = await prisma.user.findFirst({
          where: { email: { equals: parsed.data.email, mode: "insensitive" } },
        });
        if (!user) return null;
        // Le modèle User n'a pas de champ "status" : la présence du compte suffit.
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role?: UserRole };
        token.sub = u.id;
        token.role = u.role ?? UserRole.CLIENT;
      }

      const sub = typeof token.sub === "string" ? token.sub : undefined;
      if (sub && !token.role) {
        try {
          const row = await prisma.user.findUnique({
            where: { id: sub },
            select: { role: true },
          });
          if (row) token.role = row.role;
        } catch {
          token.role = UserRole.CLIENT;
        }
      }

      if (!token.sub && typeof token.id === "string") {
        token.sub = token.id;
      }

      return token;
    },
    async session({ session, token }) {
      const sub = typeof token.sub === "string" ? token.sub : undefined;
      if (session.user && sub) {
        session.user.id = sub;
        const roleFromToken = token.role as UserRole | undefined;
        try {
          const row = await prisma.user.findUnique({
            where: { id: sub },
            select: { role: true, name: true, email: true },
          });
          if (row) {
            session.user.role = row.role;
            if (row.name) session.user.name = row.name;
            if (row.email) session.user.email = row.email;
          } else {
            session.user.role = roleFromToken ?? UserRole.CLIENT;
          }
        } catch {
          session.user.role = roleFromToken ?? UserRole.CLIENT;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
