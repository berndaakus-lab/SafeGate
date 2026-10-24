import { z } from "zod";
import { supabaseAdmin } from "./supabase";

export function normalizeEmail(value?: string | null): string | null {
  const v = value?.trim().toLowerCase();
  return v ? v : null;
}

// Stores every phone in one canonical form (+233XXXXXXXXX for Ghana numbers)
// so "0244 123 456", "233244123456" and "+233 24 412 3456" all match at login.
export function normalizePhone(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  let international: string;
  if (raw.startsWith("+")) international = digits;
  else if (digits.startsWith("00")) international = digits.slice(2);
  else if (digits.startsWith("233")) international = digits;
  else if (digits.startsWith("0") && digits.length === 10) international = "233" + digits.slice(1);
  else if (digits.length === 9) international = "233" + digits;
  else international = digits;
  // "+233 (0) 55..." keeps the trunk 0 after the country code, which isn't part of the number
  if (international.startsWith("2330")) international = "233" + international.slice(4);
  return "+" + international;
}

// A Ghana number is +233 followed by exactly 9 digits. Other countries' numbers are only length-checked.
export function isValidPhone(normalized: string): boolean {
  return normalized.startsWith("+233") ? /^\+233\d{9}$/.test(normalized) : /^\+[1-9]\d{8,14}$/.test(normalized);
}

export function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

// Escapes LIKE wildcards so ilike() does an exact, case-insensitive match.
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => "\\" + c);
}

// The superadmin is matched by email before any staff/parent lookup, so an
// account sharing that email would be unreachable at login.
export function isReservedSuperadminEmail(email?: string | null): boolean {
  const reserved = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  return !!email && !!reserved && email.trim().toLowerCase() === reserved;
}

export const optionalEmail = z
  .string()
  .trim()
  .max(255)
  .optional()
  .nullable()
  .transform(normalizeEmail)
  .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address.");

// Used for both the login phone and the SMS alert phone, so every stored
// number is in the same +233XXXXXXXXX form regardless of how it was typed.
export const optionalPhone = z
  .string()
  .trim()
  .max(30, "That phone number is too long.")
  .optional()
  .nullable()
  .transform(normalizePhone)
  .refine((v) => v === null || isValidPhone(v), "Enter a valid phone number with 10 digits, e.g. 0244123456.");

export const requiredName = z.string().trim().min(1, "Enter a name.").max(200, "That name is too long.");

export const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(200, "That password is too long.");

export type LoginFieldErrors = { email?: string; loginPhone?: string };

/**
 * Returns field errors if the email or login phone is missing, reserved, or
 * already used by any staff or parent account (across both tables, since
 * login checks both), otherwise null.
 */
export async function findLoginConflict({
  email,
  loginPhone,
  excludeStaffId,
  excludeParentId,
}: {
  email: string | null;
  loginPhone: string | null;
  excludeStaffId?: string;
  excludeParentId?: string;
}): Promise<LoginFieldErrors | null> {
  if (!email && !loginPhone) {
    const text = "Enter an email or a login phone number.";
    return { email: text, loginPhone: text };
  }
  if (isReservedSuperadminEmail(email)) return { email: "That email is reserved and cannot be used for this account." };

  const tables = [
    { table: "staff", exclude: excludeStaffId },
    { table: "parents", exclude: excludeParentId },
  ] as const;

  const errors: LoginFieldErrors = {};
  for (const { table, exclude } of tables) {
    if (email && !errors.email) {
      let q = supabaseAdmin.from(table).select("id").ilike("email", escapeLike(email)).limit(1);
      if (exclude) q = q.neq("id", exclude);
      const { data } = await q;
      if (data?.length) errors.email = "This email is already used by another account.";
    }
    if (loginPhone && !errors.loginPhone) {
      let q = supabaseAdmin.from(table).select("id").eq("login_phone", loginPhone).limit(1);
      if (exclude) q = q.neq("id", exclude);
      const { data } = await q;
      if (data?.length) errors.loginPhone = "This phone number is already used by another account.";
    }
  }
  return errors.email || errors.loginPhone ? errors : null;
}
