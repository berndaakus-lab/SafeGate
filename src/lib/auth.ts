import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { escapeLike, isEmailIdentifier, normalizeEmail, normalizePhone } from "@/lib/identity";

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL!;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD!;

// Constant-time string comparison (hash both sides to a fixed length first,
// so timingSafeEqual never leaks length info via an early throw).
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

async function findAccount(table: "staff" | "parents", identifier: string) {
  let q = supabaseAdmin.from(table).select("*, schools(name)");
  if (isEmailIdentifier(identifier)) {
    const email = normalizeEmail(identifier);
    if (!email) return null;
    q = q.ilike("email", escapeLike(email));
  } else {
    const phone = normalizePhone(identifier);
    if (!phone) return null;
    q = q.eq("login_phone", phone);
  }
  const { data } = await q.maybeSingle();
  return data;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim();
        const password = credentials?.password;
        if (!identifier || !password) return null;

        // 1. Check superadmin first
        if (
          isEmailIdentifier(identifier) &&
          safeEqual(identifier.toLowerCase(), SUPERADMIN_EMAIL.trim().toLowerCase()) &&
          safeEqual(password, SUPERADMIN_PASSWORD)
        ) {
          return {
            id: "superadmin",
            email: SUPERADMIN_EMAIL,
            name: "Super Admin",
            role: "superadmin",
            schoolId: null,
            schoolName: null,
            loginPhone: null,
          };
        }

        // 2. Staff, then 3. parents
        const staff = await findAccount("staff", identifier);
        if (staff) {
          const valid = await bcrypt.compare(password, staff.password);
          if (!valid) return null;
          return {
            id: staff.id,
            email: staff.email ?? null,
            name: staff.name,
            role: staff.role,
            schoolId: staff.school_id,
            schoolName: staff.schools?.name,
            loginPhone: staff.login_phone ?? null,
          };
        }

        const parent = await findAccount("parents", identifier);
        if (parent) {
          const valid = await bcrypt.compare(password, parent.password);
          if (!valid) return null;
          return {
            id: parent.id,
            email: parent.email ?? null,
            name: parent.name,
            role: "parent",
            schoolId: parent.school_id,
            schoolName: parent.schools?.name,
            loginPhone: parent.login_phone ?? null,
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
        token.loginPhone = (user as any).loginPhone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).schoolName = token.schoolName;
        (session.user as any).loginPhone = token.loginPhone;
      }
      return session;
    },
  },
};
