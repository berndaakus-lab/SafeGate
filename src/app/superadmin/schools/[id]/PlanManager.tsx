"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import FieldError, { readApiErrors, type FieldErrors } from "@/components/FieldError";
import {
  BILLING_PERIODS,
  PERIOD_LABEL,
  TIERS,
  periodPriceGhs,
  subscriptionState,
  type Tier,
} from "@/lib/subscription";

const TIER_STYLE: Record<Tier, { active: string; label: string; popular?: boolean }> = {
  standard: { active: "border-slate-400 bg-slate-50", label: "text-slate-700" },
  growth: { active: "border-blue-500 bg-blue-50", label: "text-blue-700", popular: true },
  premier: { active: "border-purple-500 bg-purple-50", label: "text-purple-700" },
  international: { active: "border-slate-700 bg-slate-900", label: "text-white" },
};

const inputClass =
  "px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// Dates are chosen as whole days; store them as the end of that day so a
// trial "ending 28 Oct" still works all of 28 Oct.
const toEndOfDayIso = (date: string) => (date ? new Date(`${date}T23:59:59.000Z`).toISOString() : null);
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });

export default function PlanManager({
  schoolId,
  currentPlan,
  trialEndsAt,
  paidUntil,
  maxStudents,
  customPrice,
  tierDefaults,
}: {
  schoolId: string;
  currentPlan: string;
  trialEndsAt: string | null;
  paidUntil: string | null;
  maxStudents: number;
  customPrice: number | null;
  tierDefaults: Record<Tier, number | null>;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [trialEnd, setTrialEnd] = useState(toDateInput(trialEndsAt));
  const [paidEnd, setPaidEnd] = useState(toDateInput(paidUntil));
  const [maxS, setMaxS] = useState(String(maxStudents));
  const [price, setPrice] = useState(customPrice ? String(customPrice) : "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const tier: Tier = plan in TIERS ? (plan as Tier) : "growth";
  const monthly = price ? parseFloat(price) : tierDefaults[tier];
  const state = subscriptionState({ trial_ends_at: toEndOfDayIso(trialEnd), paid_until: toEndOfDayIso(paidEnd) });

  const statusText =
    state.kind === "paid"
      ? `Paid until ${fmtDate(state.endsAt.toISOString())} (${state.daysLeft} days left)`
      : state.kind === "trial"
        ? `On free trial until ${fmtDate(state.endsAt.toISOString())} (${state.daysLeft} days left)`
        : state.kind === "expired"
          ? `${state.wasPaid ? "Subscription" : "Trial"} ended ${fmtDate(state.endedAt.toISOString())}`
          : "No trial or paid dates set";

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    setError("");
    setFieldErrors({});
    const res = await fetch(`/api/superadmin/schools/${schoolId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        trial_ends_at: toEndOfDayIso(trialEnd),
        paid_until: toEndOfDayIso(paidEnd),
        max_students: parseInt(maxS) || 100,
        custom_price: price ? parseFloat(price) : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { message, fields } = await readApiErrors(res, "Failed to save the plan.");
      setFieldErrors(fields);
      setError(message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <p className={`text-sm font-medium rounded-lg px-4 py-2.5 border ${
        state.kind === "expired" ? "bg-red-50 border-red-100 text-red-700"
        : state.kind === "paid" ? "bg-green-50 border-green-100 text-green-700"
        : "bg-amber-50 border-amber-100 text-amber-800"
      }`}>
        {statusText}
      </p>

      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">
          Plan tier{plan === "trial" && <span className="text-slate-400"> (not chosen yet, priced as Growth)</span>}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(TIERS) as Tier[]).map((t) => {
            const isActive = plan === t;
            const style = TIER_STYLE[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setPlan(t)}
                aria-pressed={isActive}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  isActive ? style.active : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                {style.popular && (
                  <span className="absolute -top-2 left-3 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Popular</span>
                )}
                <p className={`font-bold text-sm ${isActive ? style.label : "text-slate-800"}`}>{TIERS[t].label}</p>
                <p className={`text-xs mt-0.5 ${isActive && t === "international" ? "text-slate-300" : "text-slate-400"}`}>{TIERS[t].sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pm-trial" className="block text-xs font-medium text-slate-600 mb-1.5">Free trial ends on</label>
          <input id="pm-trial" type="date" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} className={`w-full ${inputClass}`} />
          <FieldError message={fieldErrors.trial_ends_at} />
        </div>
        <div>
          <label htmlFor="pm-paid" className="block text-xs font-medium text-slate-600 mb-1.5">Paid until</label>
          <input id="pm-paid" type="date" value={paidEnd} onChange={(e) => setPaidEnd(e.target.value)} className={`w-full ${inputClass}`} />
          <p className="text-xs text-slate-400 mt-1">Set automatically by MoMo payments. Edit it to record cash or WhatsApp payments.</p>
          <FieldError message={fieldErrors.paid_until} />
        </div>
        <div>
          <label htmlFor="pm-max" className="block text-xs font-medium text-slate-600 mb-1.5">Max students</label>
          <input id="pm-max" type="number" min={1} value={maxS} onChange={(e) => setMaxS(e.target.value)} className={`w-full sm:w-40 ${inputClass}`} />
          <FieldError message={fieldErrors.max_students} />
        </div>
        <div>
          <label htmlFor="pm-price" className="block text-xs font-medium text-slate-600 mb-1.5">Agreed monthly price (GHS)</label>
          <input
            id="pm-price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={tierDefaults[tier] ? `Tier default: ${tierDefaults[tier]}` : "No tier default, set a price"}
            className={`w-full sm:w-48 ${inputClass}`}
          />
          <FieldError message={fieldErrors.custom_price} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium text-slate-600 mb-2">What the school pays online</p>
        {monthly ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {BILLING_PERIODS.map((m) => (
              <div key={m}>
                <p className="text-xs text-slate-500">{PERIOD_LABEL[m]}</p>
                <p className="font-semibold text-slate-900 tabular-nums">GHS {periodPriceGhs(monthly, m).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-amber-700">No price yet, so the school can&apos;t pay online. Set an agreed monthly price.</p>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : "Save Plan"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
