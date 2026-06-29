import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL!;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD!;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) return null;

        // Superadmin — env-based, no DB lookup
        if (credentials.role === "superadmin") {
          if (
            credentials.email !== SUPERADMIN_EMAIL ||
            credentials.password !== SUPERADMIN_PASSWORD
          ) return null;
          return {
            id: "superadmin",
            email: SUPERADMIN_EMAIL,
            name: "Super Admin",
            role: "superadmin",
            schoolId: null,
            schoolName: null,
          };
        }

        // Parent
        if (credentials.role === "parent") {
          const { data: parent } = await supabaseAdmin
            .from("parents")
            .select("*, schools(name)")
            .eq("email", credentials.email)
            .single();

          if (!parent) return null;
          const valid = await bcrypt.compare(credentials.password, parent.password);
          if (!valid) return null;

          return {
            id: parent.id,
            email: parent.email,
            name: parent.name,
            role: "parent",
            schoolId: parent.school_id,
            schoolName: parent.schools?.name,
          };
        }

        // Staff (admin, guard, teacher)
        if (credentials.role === "staff") {
          const { data: staff } = await supabaseAdmin
            .from("staff")
            .select("*, schools(name)")
            .eq("email", credentials.email)
            .single();

          if (!staff) return null;
          const valid = await bcrypt.compare(credentials.password, staff.password);
          if (!valid) return null;

          return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role,
            schoolId: staff.school_id,
            schoolName: staff.schools?.name,
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
