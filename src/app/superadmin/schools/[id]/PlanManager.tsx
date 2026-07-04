"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

const PLANS = [
  {
    value: "trial",
    label: "Trial",
    sub: "Free · 1st month",
    desc: "Free trial period, capped at max students. Countdown banner shows on their dashboard.",
    color: "border-amber-400 bg-amber-50",
    activeLabel: "text-amber-700",
  },
  {
    value: "standard",
    label: "Standard",
    sub: "Up to 100 students",
    desc: "Paid plan for smaller schools. Max student cap applies.",
    color: "border-slate-400 bg-slate-50",
    activeLabel: "text-slate-700",
  },
  {
    value: "growth",
    label: "Growth",
    sub: "101 – 500 students",
    desc: "Most popular plan. Suitable for mid-size private schools.",
    color: "border-blue-500 bg-blue-50",
    activeLabel: "text-blue-700",
    popular: true,
  },
  {
    value: "premier",
    label: "Premier",
    sub: "500+ students",
    desc: "Large schools with high daily pickup volume.",
    color: "border-purple-500 bg-purple-50",
    activeLabel: "text-purple-700",
  },
  {
    value: "international",
    label: "International",
    sub: "Any size · premium",
    desc: "International / private schools. Custom SMS sender ID and dedicated support.",
    color: "border-slate-700 bg-slate-900",
    activeLabel: "text-white",
    dark: true,
  },
];

export default function PlanManager({
  schoolId,
  currentPlan,
  trialEndsAt,
  maxStudents,
  customPrice,
}: {
  schoolId: string;
  currentPlan: string;
  trialEndsAt: string | null;
  maxStudents: number;
  customPrice: number | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [trialEnd, setTrialEnd] = useState(
    trialEndsAt ? trialEndsAt.split("T")[0] : ""
  );
  const [maxS, setMaxS] = useState(String(maxStudents));
  const [price, setPrice] = useState(customPrice ? String(customPrice) : "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    await fetch(`/api/superadmin/schools/${schoolId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        trial_ends_at: plan === "trial" && trialEnd ? new Date(trialEnd).toISOString() : null,
        max_students: parseInt(maxS) || 100,
        custom_price: price ? parseFloat(price) : null,
      }),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  const showTrialFields = plan === "trial";
  const showMaxStudents = plan === "trial" || plan === "standard";

  return (
    <div className="space-y-5">
      {/* Plan selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PLANS.map((p) => {
          const isActive = plan === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlan(p.value)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? p.color
                  : p.dark
                  ? "border-slate-200 bg-slate-100 hover:border-slate-300"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2 left-3 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <p className={`font-bold text-sm ${isActive ? p.activeLabel : p.dark ? "text-slate-600" : "text-slate-800"}`}>
                {p.label}
              </p>
              <p className={`text-xs mt-0.5 ${isActive && p.dark ? "text-slate-300" : "text-slate-400"}`}>
                {p.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected plan description */}
      {PLANS.find((p) => p.value === plan) && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
          {PLANS.find((p) => p.value === plan)!.desc}
        </p>
      )}

      {/* Trial end date — only for trial */}
      {showTrialFields && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Trial ends on</label>
          <input
            type="date"
            value={trialEnd}
            onChange={(e) => setTrialEnd(e.target.value)}
            className="w-full sm:w-64 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Max students — for trial and standard */}
      {showMaxStudents && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Max students {plan === "standard" ? "(Standard cap)" : "(Trial cap)"}
          </label>
          <input
            type="number"
            min={1}
            value={maxS}
            onChange={(e) => setMaxS(e.target.value)}
            className="w-full sm:w-40 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Agreed price for this school */}
      {plan !== "trial" && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Agreed monthly price for this school (GHS)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">GHS</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 250"
              className="w-40 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            This overrides the tier default. The school sees this exact amount on their payment page.
            Leave blank to use the tier default price.
          </p>
        </div>
      )}

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
