import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { escapeLike, isEmailIdentifier, normalizeEmail, normalizePhone } from "@/lib/identity";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/session-policy";
import { passwordFingerprint } from "@/lib/pwf";

// How often a signed-in person's account is checked against the database
const RECHECK_MS = 60_000;

// A real bcrypt hash to compare against when no account matches, so a wrong
// phone number takes as long to answer as a wrong password.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("no-such-account", 12));

type AccountState = { pwf: string; role: string; schoolId: string | null; name: string } | "gone" | "unknown";

async function loadAccountState(role: string, id: string): Promise<AccountState> {
  const table = role === "parent" ? "parents" : "staff";
  const { data, error } = await supabaseAdmin.from(table).select("name, password, school_id, role").eq("id", id).maybeSingle();
  if (error) return "unknown";
  if (!data) return "gone";
  return {
    pwf: passwordFingerprint(data.password),
    role: table === "parents" ? "parent" : data.role,
    schoolId: data.school_id,
    name: data.name,
  };
}

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
  // Rolling 1-hour lifetime: every /api/auth/session call re-issues the
  // cookie, and IdleSessionGuard makes that call while the user is active.
  session: { strategy: "jwt", maxAge: IDLE_TIMEOUT_MINUTES * 60 },
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
            pwf: passwordFingerprint(staff.password),
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
            pwf: passwordFingerprint(parent.password),
          };
        }

        await bcrypt.compare(password, await getDummyHash());
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
        token.schoolName = (user as any).schoolName;
        token.loginPhone = (user as any).loginPhone;
        token.pwf = (user as any).pwf;
        token.checkedAt = Date.now();
        delete token.invalid;
        return token;
      }

      // The platform admin has no database account to check
      if (!token.sub || token.role === "superadmin" || token.invalid) return token;

      // useSession().update() after a parent changes their name re-reads
      // everything from the database; otherwise check once a minute
      const refresh = trigger === "update";
      if (!refresh && Date.now() - ((token.checkedAt as number) ?? 0) < RECHECK_MS) return token;

      const state = await loadAccountState(token.role as string, token.sub);
      if (state === "unknown") return token; // a database hiccup must not sign everyone out
      // Account deleted, or its password changed or was reset: this sign-in is no longer valid
      if (state === "gone" || (token.pwf && state.pwf !== token.pwf)) {
        token.invalid = true;
        return token;
      }

      token.pwf = state.pwf; // cookies from before this check existed carry none; adopt the current one
      token.role = state.role;
      token.schoolId = state.schoolId;
      if (refresh && state.role === "parent") token.name = state.name;
      token.checkedAt = Date.now();
      return token;
    },
    async session({ session, token }) {
      // An empty session reads as "not signed in" everywhere, including getServerSession
      if (token.invalid) return {} as typeof session;
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
