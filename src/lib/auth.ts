import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null;
        }

        if (credentials.role === "parent") {
          const parent = await prisma.parent.findUnique({
            where: { email: credentials.email },
            include: { school: true },
          });
          if (!parent) return null;
          const valid = await bcrypt.compare(credentials.password, parent.password);
          if (!valid) return null;
          return {
            id: parent.id,
            email: parent.email,
            name: parent.name,
            role: "parent",
            schoolId: parent.schoolId,
            schoolName: parent.school.name,
          };
        }

        if (credentials.role === "staff") {
          const staff = await prisma.staff.findUnique({
            where: { email: credentials.email },
            include: { school: true },
          });
          if (!staff) return null;
          const valid = await bcrypt.compare(credentials.password, staff.password);
          if (!valid) return null;
          return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role.toLowerCase(),
            schoolId: staff.schoolId,
            schoolName: staff.school.name,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
        token.schoolName = (user as any).schoolName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).schoolName = token.schoolName;
      }
      return session;
    },
  },
};
