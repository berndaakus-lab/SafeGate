import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { escapeLike, isEmailIdentifier, normalizeEmail, normalizePhone } from "@/lib/identity";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/session-policy";
import { passwordFingerprint } from "@/lib/pwf";
import { clientIp, isRateLimited, LOGIN_MAX_PER_ACCOUNT, LOGIN_WINDOW_MS, RATE_LIMITED } from "@/lib/rate-limit";

// One account, however its email/phone is typed ("0244 123 456" = "0244123456")
function accountKey(identifier: string): string {
  return isEmailIdentifier(identifier) ? (normalizeEmail(identifier) ?? "") : (normalizePhone(identifier) ?? "");
}

// How often a signed-in person's account is checked against the database
const RECHECK_MS = 60_000;

// A real bcrypt hash to compare against when no account matches, so a wrong
// phone number takes as long to answer as a wrong password.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("no-such-account", 12));

type AccountState =
  | { pwf: string; role: string; schoolId: string | null; name: string; linkedParentId: string | null }
  | "gone"
  | "unknown";

/**
 * The parent profile linked to a staff account (a teacher who is also a parent),
 * if any. Only one at the same school counts. A failed lookup (for example before
 * the staff_id column exists) counts as no link, never as a sign-out.
 */
export async function linkedParentFor(staffId: string, schoolId: string | null): Promise<string | null> {
  if (!schoolId) return null;
  const { data, error } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

// `loginRole` is the role of the account that signed in, not the side the
// person is on now: a teacher looking at their children still signed in as staff
async function loadAccountState(loginRole: string, id: string): Promise<AccountState> {
  const table = loginRole === "parent" ? "parents" : "staff";
  const { data, error } = await supabaseAdmin.from(table).select("name, password, school_id, role").eq("id", id).maybeSingle();
  if (error) return "unknown";
  if (!data) return "gone";
  return {
    pwf: passwordFingerprint(data.password),
    role: table === "parents" ? "parent" : data.role,
    schoolId: data.school_id,
    name: data.name,
    linkedParentId: table === "staff" ? await linkedParentFor(id, data.school_id) : null,
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
      async authorize(credentials, req) {
        const identifier = credentials?.identifier?.trim();
        const password = credentials?.password;
        if (!identifier || !password) return null;

        // Tight cap per account per IP (the loose per-IP cap is in proxy.ts).
        // The thrown message reaches the login page as ?error=RateLimited.
        const key = `login:${clientIp(req?.headers)}:${accountKey(identifier)}`;
        if (await isRateLimited(key, LOGIN_WINDOW_MS, LOGIN_MAX_PER_ACCOUNT)) {
          throw new Error(RATE_LIMITED);
        }

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
            linkedParentId: await linkedParentFor(staff.id, staff.school_id),
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // A staff member who is also a parent always starts on the staff side
        token.role = (user as any).role;
        token.loginRole = (user as any).role;
        token.parentId = (user as any).linkedParentId ?? null;
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

      // useSession().update() after a parent changes their name, or to switch
      // between the staff and parent side, re-reads everything from the
      // database; otherwise check once a minute
      const refresh = trigger === "update";
      const switchTo = refresh ? (session as any)?.switchTo : undefined;
      // Everyone but the platform admin belongs to a school. A sign-in that has
      // lost its school is re-read now rather than in a minute: without it every
      // admin page shows zeros and every save says "Unauthorized".
      const missingSchool = !token.schoolId;
      if (!refresh && !missingSchool && Date.now() - ((token.checkedAt as number) ?? 0) < RECHECK_MS) return token;

      // Sign-ins from before the switch existed carry no loginRole: theirs is their role
      const loginRole = (token.loginRole as string | undefined) ?? (token.role as string);
      const state = await loadAccountState(loginRole, token.sub);
      if (state === "unknown") return token; // a database hiccup must not sign everyone out
      // Account deleted, or its password changed or was reset: this sign-in is no longer valid
      if (state === "gone" || (token.pwf && state.pwf !== token.pwf)) {
        token.invalid = true;
        return token;
      }
      // An account with no school can't use any school page: treat it as signed out
      if (!state.schoolId) {
        token.invalid = true;
        return token;
      }

      token.pwf = state.pwf; // cookies from before this check existed carry none; adopt the current one
      token.loginRole = state.role;
      token.parentId = state.linkedParentId;
      // The parent side is only open while the link exists; unlinking puts them back on the staff side
      const wantParent = switchTo ? switchTo === "parent" : token.role === "parent";
      token.role = state.role !== "parent" && wantParent && state.linkedParentId ? "parent" : state.role;
      token.schoolId = state.schoolId;
      if (refresh && state.role === "parent") token.name = state.name;
      token.checkedAt = Date.now();
      return token;
    },
    async session({ session, token }) {
      // An empty session reads as "not signed in" everywhere, including getServerSession
      if (token.invalid) return {} as typeof session;
      if (session.user) {
        const loginRole = (token.loginRole as string | undefined) ?? (token.role as string);
        const onParentSide = token.role === "parent" && loginRole !== "parent";
        // On the parent side every parent page works with the linked parent profile
        (session.user as any).id = onParentSide ? token.parentId : token.sub;
        // The account that signed in: passwords are checked and changed on this one
        (session.user as any).loginId = token.sub;
        (session.user as any).loginTable = loginRole === "parent" ? "parents" : "staff";
        // The other side this person can switch to, if they are staff and a parent
        (session.user as any).switchTo = token.parentId && loginRole !== "parent" ? (onParentSide ? loginRole : "parent") : null;
        (session.user as any).role = token.role;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).schoolName = token.schoolName;
        (session.user as any).loginPhone = token.loginPhone;
      }
      return session;
    },
  },
};
