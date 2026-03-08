import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organisations } from "@/lib/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: string;
      role: string;
      name: string;
      email: string;
    };
  }

  interface User {
    id: string;
    orgId: string;
    role: string;
    name: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string;
    role: string;
    name: string;
    email: string;
  }
}

const useSecureCookies = !!process.env.VERCEL || !!process.env.NEXTAUTH_URL?.startsWith("https://");

export const authOptions: NextAuthOptions = {
  useSecureCookies,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email.toLowerCase()))
          .then((rows) => rows[0] ?? null);

        if (!user) return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          orgId: user.orgId,
          role: user.role,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.orgId = user.orgId;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        orgId: token.orgId,
        role: token.role,
        name: token.name,
        email: token.email,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
