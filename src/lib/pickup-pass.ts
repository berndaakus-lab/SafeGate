import { randomInt } from "crypto";
import QRCode from "qrcode";
import { supabaseAdmin } from "./supabase";

// No 0/O/1/I so a code read aloud or typed from a message is hard to get wrong
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** The 6-character code on a daily pickup. */
export const shortCode = () => randomCode(6);
/** The lasting code on a standing pass (long, so it can't be guessed). */
export const newPassToken = () => randomCode(12);
/** The link token in a message to a parent. */
export const newApprovalToken = () => randomCode(24);
/** What a valid approval link token looks like (checked before any database lookup) */
export const APPROVAL_TOKEN = /^[A-Z2-9]{24}$/;

// Ghana is on UTC all year, and the server runs on UTC, so "today" is the UTC day
export const todayUtc = () => new Date().toISOString().slice(0, 10);

export function endOfTodayIso(): string {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

export type StandingFields = {
  standing_token: string | null;
  standing_until: string | null;
  standing_school_days: boolean | null;
};

export type PassValidity = { ok: true } | { ok: false; reason: "cancelled" | "expired" | "school_days" };

/** Whether a person's standing pass can be used today. */
export function standingPassValidity(person: StandingFields, now = new Date()): PassValidity {
  if (!person.standing_token) return { ok: false, reason: "cancelled" };
  const today = now.toISOString().slice(0, 10);
  if (person.standing_until && today > person.standing_until) return { ok: false, reason: "expired" };
  const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (person.standing_school_days && (day === 0 || day === 6)) return { ok: false, reason: "school_days" };
  return { ok: true };
}

export const PASS_PROBLEM: Record<"cancelled" | "expired" | "school_days", string> = {
  cancelled: "This pass has been cancelled by the parent.",
  expired: "This pass has expired. Ask the parent for a new one.",
  school_days: "This pass is only valid on school days (Monday to Friday).",
};

export function standingPassUrl(token: string): string {
  return `${process.env.NEXTAUTH_URL}/guard/pass/${token}`;
}

export function passQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(standingPassUrl(token), {
    width: 400,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}

/** Children a person's standing pass covers right now: still active, still this parent's. */
export async function coveredChildren(personId: string, parentId: string): Promise<string[]> {
  const { data: links } = await supabaseAdmin.from("standing_pass_children").select("student_id").eq("person_id", personId);
  const ids = (links ?? []).map((l: any) => l.student_id as string);
  if (!ids.length) return [];
  const { data: students } = await supabaseAdmin
    .from("students")
    .select("id")
    .in("id", ids)
    .eq("parent_id", parentId)
    .is("archived_at", null);
  return (students ?? []).map((s: any) => s.id as string);
}

/**
 * Today's code for a standing pass: made on the first scan of the day and reused
 * after that, so two guards scanning together still share one code and one
 * pickup per child. The children on it are refreshed from the parent's current
 * choices each time.
 */
export async function ensureStandingCode(
  person: { id: string; parent_id: string },
  studentIds: string[]
): Promise<{ code: string } | null> {
  const validOn = todayUtc();
  const findToday = () =>
    supabaseAdmin
      .from("pickup_codes")
      .select("id, code, student_ids")
      .eq("authorized_person_id", person.id)
      .eq("valid_on", validOn)
      .eq("kind", "standing")
      .maybeSingle();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await findToday();
    if (existing) {
      const same =
        (existing.student_ids ?? []).length === studentIds.length && studentIds.every((id) => (existing.student_ids ?? []).includes(id));
      if (!same) await supabaseAdmin.from("pickup_codes").update({ student_id: studentIds[0], student_ids: studentIds }).eq("id", existing.id);
      return { code: existing.code as string };
    }
    const { data, error } = await supabaseAdmin
      .from("pickup_codes")
      .insert({
        code: shortCode(),
        student_id: studentIds[0],
        student_ids: studentIds,
        parent_id: person.parent_id,
        authorized_person_id: person.id,
        expires_at: endOfTodayIso(),
        kind: "standing",
        valid_on: validOn,
      })
      .select("code")
      .single();
    if (!error) return { code: data.code as string };
    // 23505: another scan made today's code first, or the random code collided. Look again, or retry.
    if (error.code !== "23505") return null;
  }
  return null;
}

/**
 * Other families at the same school with a working standing pass for the same
 * phone number (a driver hired by several families). Their id and parent only;
 * the caller still checks each pass's own validity, photo and children.
 */
export async function sharedPassPeople(person: { id: string; phone: string | null }, schoolId: string) {
  if (!person.phone) return [];
  const { data } = await supabaseAdmin
    .from("authorized_persons")
    .select("id, parent_id, standing_token, standing_until, standing_school_days, photo_url, parents!inner(school_id)")
    .eq("phone", person.phone)
    .neq("id", person.id)
    .not("standing_token", "is", null)
    .eq("parents.school_id", schoolId);
  return data ?? [];
}

/** A one-child code for a pickup the parent approved from a message. */
export async function createLookupCode(args: { parentId: string; studentId: string; personId: string }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("pickup_codes")
      .insert({
        code: shortCode(),
        student_id: args.studentId,
        student_ids: [args.studentId],
        parent_id: args.parentId,
        authorized_person_id: args.personId,
        expires_at: endOfTodayIso(),
        kind: "lookup",
      })
      .select("id, code")
      .single();
    if (!error) return { id: data.id as string, code: data.code as string };
    if (error.code !== "23505") return null;
  }
  return null;
}
