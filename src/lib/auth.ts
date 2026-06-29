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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { email, password } = credentials;

        // 1. Check superadmin first
        if (email === SUPERADMIN_EMAIL && password === SUPERADMIN_PASSWORD) {
          return {
            id: "superadmin",
            email: SUPERADMIN_EMAIL,
            name: "Super Admin",
            role: "superadmin",
            schoolId: null,
            schoolName: null,
          };
        }

        // 2. Check staff table
        const { data: staff } = await supabaseAdmin
          .from("staff")
          .select("*, schools(name)")
          .eq("email", email)
          .single();

        if (staff) {
          const valid = await bcrypt.compare(password, staff.password);
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

        // 3. Check parents table
        const { data: parent } = await supabaseAdmin
          .from("parents")
          .select("*, schools(name)")
          .eq("email", email)
          .single();

        if (parent) {
          const valid = await bcrypt.compare(password, parent.password);
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
