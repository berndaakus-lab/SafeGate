import { supabaseAdmin } from "./supabase";
import { addMonths, nextPeriodStart } from "./subscription";

export type SettleResult = "paid" | "pending" | "failed" | "not_found";

const FAILED_STATUSES = ["failed", "abandoned", "reversed"];

async function markFailed(reference: string, reason: string) {
  await supabaseAdmin
    .from("payments")
    .update({ status: "failed", failure_reason: reason })
    .eq("reference", reference)
    .eq("status", "pending");
}

/**
 * Checks a MoMo charge with Paystack and, if it really succeeded for the
 * amount and currency we asked for, extends the school's paid period.
 *
 * Safe to call many times and from several places at once (the payment page
 * polling, and the background job that follows up unconfirmed payments):
 * the school is credited only by the call that moves the payment out of
 * "pending".
 */
export async function settlePayment(reference: string): Promise<SettleResult> {
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("school_id, months, tier, amount_pesewas, currency, status")
    .eq("reference", reference)
    .maybeSingle();
  if (!payment) return "not_found";
  if (payment.status === "success") return "paid";
  if (payment.status === "failed") return "failed";

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  const tx = body?.data;
  const status: string | undefined = tx?.status;

  if (!status || !res.ok) return "pending";
  if (FAILED_STATUSES.includes(status)) {
    await markFailed(reference, `paystack:${status}`);
    return "failed";
  }
  if (status !== "success") return "pending";

  // Never trust that a "success" is for the right amount: the charge could
  // have been created or altered outside this app.
  if (tx.reference !== reference || tx.currency !== payment.currency || Number(tx.amount) < payment.amount_pesewas) {
    console.error("[payments] amount/currency mismatch", {
      reference,
      expected: `${payment.amount_pesewas} ${payment.currency}`,
      got: `${tx.amount} ${tx.currency}`,
    });
    await markFailed(reference, `mismatch: expected ${payment.amount_pesewas} ${payment.currency}, got ${tx.amount} ${tx.currency}`);
    return "failed";
  }

  // Claim: only the call that flips pending -> success credits the school
  const { data: claimed } = await supabaseAdmin
    .from("payments")
    .update({ status: "success", paid_at: new Date().toISOString() })
    .eq("reference", reference)
    .eq("status", "pending")
    .select("id");
  if (!claimed?.length) return "paid";

  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("plan, paid_until, trial_ends_at")
    .eq("id", payment.school_id)
    .single();

  const paidUntil = addMonths(nextPeriodStart(school ?? { paid_until: null, trial_ends_at: null }), payment.months);
  const { error } = await supabaseAdmin
    .from("schools")
    .update({
      paid_until: paidUntil.toISOString(),
      paid_at: new Date().toISOString(),
      // A school still on the legacy "trial" value takes the tier it was priced at
      ...(school?.plan === "trial" || !school?.plan ? { plan: payment.tier } : {}),
    })
    .eq("id", payment.school_id);

  if (error) {
    // Payment is recorded as successful; the superadmin can set paid_until by hand
    console.error("[payments] payment", reference, "succeeded but extending the school failed:", error.message);
  }
  return "paid";
}
