// Kept free of server imports so client components can use the constants.
type Settings = Record<string, string>;

const DAY_MS = 24 * 60 * 60 * 1000;

export const BILLING_PERIODS = [1, 3, 6, 12] as const;
export type BillingMonths = (typeof BILLING_PERIODS)[number];

export const PERIOD_LABEL: Record<BillingMonths, string> = {
  1: "1 month",
  3: "3 months",
  6: "6 months",
  12: "12 months",
};

export const TIERS = {
  standard: { label: "Standard", sub: "Up to 100 students", setting: "tier_standard_monthly" },
  growth: { label: "Growth", sub: "101 – 500 students", setting: "tier_growth_monthly" },
  premier: { label: "Premier", sub: "501 – 1,000 students", setting: "tier_premier_monthly" },
  international: { label: "Enterprise", sub: "Multiple campuses / custom", setting: "tier_international_monthly" },
} as const;
export type Tier = keyof typeof TIERS;

/** Schools still on the legacy "trial" plan value have no tier chosen yet and are priced as Growth. */
export function tierOf(plan: string | null | undefined): Tier {
  return plan && plan in TIERS ? (plan as Tier) : "growth";
}

/**
 * The school's monthly price in GHS: its agreed price if the superadmin set
 * one, otherwise the tier's default from Settings. Null when neither gives a
 * number (e.g. Enterprise priced as "Custom"), meaning online payment isn't
 * possible until an agreed price is set.
 */
export function monthlyPriceGhs(
  school: { plan: string | null; custom_price: number | null },
  settings: Settings
): number | null {
  if (school.custom_price && school.custom_price > 0) return Number(school.custom_price);
  const raw = (settings[TIERS[tierOf(school.plan)].setting] ?? "").replace(/[^\d.]/g, "");
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** No discounts: a period costs its number of months × the monthly price. */
export function periodPriceGhs(monthly: number, months: BillingMonths): number {
  return Math.round(monthly * months * 100) / 100;
}

export function toPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

/** Adds calendar months, clamping to the last day of a shorter month (Jan 31 + 1 → Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export type SubscriptionState =
  | { kind: "paid"; endsAt: Date; daysLeft: number }
  | { kind: "trial"; endsAt: Date; daysLeft: number }
  | { kind: "expired"; endedAt: Date; wasPaid: boolean }
  | { kind: "none" };

/** Where a school stands, from its paid_until and trial_ends_at dates. */
export function subscriptionState(
  school: { paid_until: string | null; trial_ends_at: string | null },
  now = new Date()
): SubscriptionState {
  const paidUntil = school.paid_until ? new Date(school.paid_until) : null;
  const trialEnds = school.trial_ends_at ? new Date(school.trial_ends_at) : null;
  const daysLeft = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / DAY_MS);

  if (paidUntil && paidUntil > now) return { kind: "paid", endsAt: paidUntil, daysLeft: daysLeft(paidUntil) };
  if (trialEnds && trialEnds > now) return { kind: "trial", endsAt: trialEnds, daysLeft: daysLeft(trialEnds) };
  if (paidUntil) return { kind: "expired", endedAt: paidUntil, wasPaid: true };
  if (trialEnds) return { kind: "expired", endedAt: trialEnds, wasPaid: false };
  return { kind: "none" };
}

/** A new paid period starts when the current one (paid or free trial) ends, so paying early never loses days. */
export function nextPeriodStart(
  school: { paid_until: string | null; trial_ends_at: string | null },
  now = new Date()
): Date {
  const candidates = [now.getTime()];
  if (school.paid_until) candidates.push(new Date(school.paid_until).getTime());
  if (school.trial_ends_at) candidates.push(new Date(school.trial_ends_at).getTime());
  return new Date(Math.max(...candidates));
}
