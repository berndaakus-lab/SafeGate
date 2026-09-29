import { after } from "next/server";
import { supabaseAdmin } from "./supabase";
import { smsService } from "./sms";
import { withRetry } from "./retry";
import { settlePayment } from "./payments";
import { subscriptionState } from "./subscription";
import { formatDate } from "./utils";

// Vercel Hobby allows only a daily cron, so the app's own traffic drives this
// job: any page load may trigger it (after the response is sent), and a
// database-level claim makes it run at most once per RUN_INTERVAL across all
// servers. The daily cron (/api/cron/daily) is only a safety net for quiet days.
const RUN_INTERVAL_MS = 60 * 60 * 1000;
// Per-server throttle so most page loads don't even touch the database
const LOCAL_THROTTLE_MS = 10 * 60 * 1000;
const REMINDER_DAYS = [3, 7, 14] as const;

let lastLocalCheck = 0;

/** Call from server layouts. Cheap: at most one DB check per server every 10 minutes. */
export function scheduleBackgroundJobs() {
  const now = Date.now();
  if (now - lastLocalCheck < LOCAL_THROTTLE_MS) return;
  lastLocalCheck = now;
  after(async () => {
    try {
      await runSubscriptionJobs();
    } catch (err: any) {
      console.error("[jobs] subscription jobs failed:", err?.message);
    }
  });
}

/** Runs the jobs if no server has run them in the last hour (or always, when forced by the cron). */
export async function runSubscriptionJobs({ force = false } = {}) {
  const nowIso = new Date().toISOString();
  if (!force) {
    const cutoff = new Date(Date.now() - RUN_INTERVAL_MS).toISOString();
    const { data: claimed } = await supabaseAdmin
      .from("job_runs")
      .update({ last_run_at: nowIso })
      .eq("name", "subscriptions")
      .lt("last_run_at", cutoff)
      .select("name");
    if (!claimed?.length) return { skipped: true };
  } else {
    await supabaseAdmin.from("job_runs").update({ last_run_at: nowIso }).eq("name", "subscriptions");
  }

  const payments = await reconcilePendingPayments();
  const reminders = await sendSubscriptionReminders();
  return { skipped: false, payments, reminders };
}

/** Payments approved on the phone but never confirmed in the browser (page closed) still get applied. */
async function reconcilePendingPayments() {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: pending } = await supabaseAdmin
    .from("payments")
    .select("reference")
    .eq("status", "pending")
    .gte("created_at", since)
    .limit(25);

  const results: Record<string, number> = {};
  for (const p of pending ?? []) {
    const r = await settlePayment(p.reference).catch(() => "pending");
    results[r] = (results[r] ?? 0) + 1;
  }
  return results;
}

/**
 * SMS each school's admins 14, 7 and 3 days before their free trial or paid
 * period ends. Each reminder is recorded, so it's sent once per period even
 * if this runs many times. If a run is missed, the next one sends the
 * nearest reminder due (e.g. the 7-day one at 6 days left), never several.
 */
async function sendSubscriptionReminders() {
  // Read settings directly: getSettings() uses a render-time API that
  // doesn't belong in a background (after()) task.
  const [{ data: schools }, { data: waSetting }] = await Promise.all([
    supabaseAdmin.from("schools").select("id, name, trial_ends_at, paid_until").eq("is_active", true),
    supabaseAdmin.from("settings").select("value").eq("key", "whatsapp").maybeSingle(),
  ]);
  const whatsapp = waSetting?.value ?? "";
  let sent = 0;
  let noPhone = 0;

  for (const school of schools ?? []) {
    const state = subscriptionState(school);
    if (state.kind !== "trial" && state.kind !== "paid") continue;
    const daysBefore = REMINDER_DAYS.find((d) => state.daysLeft <= d);
    if (!daysBefore) continue;

    const kind = state.kind === "trial" ? "trial" : "renewal";
    const periodEnd = state.endsAt.toISOString().slice(0, 10);

    // Claim this reminder; if the row already exists it was sent before
    const { data: claimed } = await supabaseAdmin
      .from("subscription_reminders")
      .upsert(
        { school_id: school.id, kind, period_end: periodEnd, days_before: daysBefore },
        { onConflict: "school_id,kind,period_end,days_before", ignoreDuplicates: true }
      )
      .select("school_id");
    if (!claimed?.length) continue;

    const { data: admins } = await supabaseAdmin
      .from("staff")
      .select("name, login_phone")
      .eq("school_id", school.id)
      .eq("role", "admin")
      .not("login_phone", "is", null);

    if (!admins?.length) {
      noPhone++;
      console.warn(`[jobs] ${school.name}: ${kind} reminder due but no admin has a phone number`);
      continue;
    }

    const date = formatDate(state.endsAt);
    const days = `${state.daysLeft} day${state.daysLeft === 1 ? "" : "s"}`;
    const help = whatsapp ? ` Questions? WhatsApp +${whatsapp.replace(/^\+/, "")}.` : "";

    let delivered = 0;
    for (const admin of admins) {
      const first = (admin.name ?? "").trim().split(/\s+/)[0] || "there";
      const message =
        kind === "trial"
          ? `VerifyGate: Hi ${first}, the free trial for ${school.name} ends on ${date} (${days}). To keep pickups running, open VerifyGate and tap Pay now on your dashboard.${help}`
          : `VerifyGate: Hi ${first}, the subscription for ${school.name} ends on ${date} (${days}). Renew from your VerifyGate dashboard to avoid interruption.${help}`;
      try {
        await withRetry(() => smsService.send({ to: admin.login_phone!, message }), { label: "subscription-reminder" });
        delivered++;
      } catch (err: any) {
        console.error(`[jobs] reminder SMS to ${school.name} admin failed:`, err?.message);
      }
    }

    await supabaseAdmin
      .from("subscription_reminders")
      .update({ recipients: delivered })
      .eq("school_id", school.id)
      .eq("kind", kind)
      .eq("period_end", periodEnd)
      .eq("days_before", daysBefore);
    sent += delivered;
  }

  return { sent, schoolsWithoutAdminPhone: noPhone };
}
