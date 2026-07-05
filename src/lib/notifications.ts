/**
 * Central notification service — Web Push primary, SMS fallback.
 * All delivery outcomes are logged to notification_logs table.
 */
import webpush from "web-push";
import { supabaseAdmin } from "./supabase";
import { withRetry } from "./retry";

// VAPID must be set in env
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "hello@verifygate.app"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

type LogOutcome = "push_ok" | "push_fail_sms_ok" | "push_fail_sms_fail" | "sms_only_ok" | "sms_only_fail" | "no_delivery";

async function logDelivery({
  parentId,
  studentId,
  channel,
  outcome,
  error,
}: {
  parentId?: string;
  studentId?: string;
  channel: string;
  outcome: LogOutcome;
  error?: string;
}) {
  try {
    await supabaseAdmin.from("notification_logs").insert({
      parent_id: parentId ?? null,
      student_id: studentId ?? null,
      channel,
      outcome,
      error: error ?? null,
    });
  } catch (e: any) {
    // Logging must never throw
    console.error("[notify] failed to log delivery:", e?.message);
  }
}

async function sendPush(subscription: any, payload: NotificationPayload): Promise<boolean> {
  if (!process.env.VAPID_PUBLIC_KEY) return false;
  try {
    await withRetry(
      () => webpush.sendNotification(subscription, JSON.stringify(payload)),
      { label: "web-push" }
    );
    return true;
  } catch (err: any) {
    // 410 Gone = subscription expired/invalid — remove it
    if (err?.statusCode === 410) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);
    }
    console.warn("[notify] push failed:", err?.message);
    return false;
  }
}

/**
 * Send a notification to a parent.
 * Tries push first; falls back to SMS if push fails or no subscription found.
 */
export async function sendNotification({
  parentId,
  parentPhone,
  studentId,
  payload,
  smsText,
}: {
  parentId: string;
  parentPhone?: string;
  studentId?: string;
  payload: NotificationPayload;
  smsText: string;
}) {
  // Get all push subscriptions for this parent
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("subscription_json")
    .eq("parent_id", parentId);

  let pushOk = false;

  if (subs && subs.length > 0) {
    // Try all subscriptions (parent may have multiple devices)
    const results = await Promise.allSettled(
      subs.map((row: any) => sendPush(row.subscription_json, payload))
    );
    pushOk = results.some((r) => r.status === "fulfilled" && r.value === true);
  }

  if (pushOk) {
    await logDelivery({ parentId, studentId, channel: "push", outcome: "push_ok" });
    return;
  }

  // Push failed or no subscription — fall back to SMS
  if (parentPhone) {
    try {
      await withRetry(
        () => sendPickupSMSRaw({ phone: parentPhone, message: smsText }),
        { label: "sms-fallback" }
      );
      const outcome: LogOutcome = subs && subs.length > 0 ? "push_fail_sms_ok" : "sms_only_ok";
      await logDelivery({ parentId, studentId, channel: "sms", outcome });
    } catch (err: any) {
      const outcome: LogOutcome = subs && subs.length > 0 ? "push_fail_sms_fail" : "sms_only_fail";
      await logDelivery({ parentId, studentId, channel: "sms", outcome, error: err?.message });
    }
  } else {
    await logDelivery({ parentId, studentId, channel: "none", outcome: "no_delivery" });
    console.warn("[notify] no push subscription and no phone for parent", parentId);
  }
}

// Raw SMS send (message already composed)
async function sendPickupSMSRaw({ phone, message }: { phone: string; message: string }) {
  const apiKey = process.env.NKOMO_API_KEY;
  const senderId = process.env.NKOMO_SENDER_ID || "VerifyGate";
  if (!apiKey) throw new Error("NKOMO_API_KEY not set");

  const clean = phone.replace(/\D/g, "");
  const intl = clean.startsWith("233") ? clean : clean.startsWith("0") ? "233" + clean.slice(1) : clean;

  const res = await fetch("https://app.nkomosms.com/api/v3/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ sender_id: senderId, message, recipient: intl }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Nkomo ${res.status}: ${JSON.stringify(body)}`);
  }
}

/**
 * Send a broadcast push to all parents of a specific school.
 * Non-blocking — fires and resolves immediately.
 */
export async function broadcastToSchool({
  schoolId,
  payload,
}: {
  schoolId: string;
  payload: NotificationPayload;
}) {
  const { data: parents } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("school_id", schoolId);

  if (!parents?.length) return;

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("parent_id, subscription_json")
    .in("parent_id", parents.map((p: any) => p.id));

  if (!subs?.length) return;

  // Fire all, don't await individually
  await Promise.allSettled(
    subs.map((row: any) => sendPush(row.subscription_json, payload))
  );
}
