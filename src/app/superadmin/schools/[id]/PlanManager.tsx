"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

const PLANS = [
  { value: "trial", label: "Trial (Free)", desc: "30-day free trial, capped at max students" },
  { value: "school", label: "School Plan", desc: "Fully active — unlimited students" },
  { value: "enterprise", label: "Enterprise", desc: "Custom arrangement" },
];

export default function PlanManager({
  schoolId,
  currentPlan,
  trialEndsAt,
  maxStudents,
}: {
  schoolId: string;
  currentPlan: string;
  trialEndsAt: string | null;
  maxStudents: number;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [trialEnd, setTrialEnd] = useState(
    trialEndsAt ? trialEndsAt.split("T")[0] : ""
  );
  const [maxS, setMaxS] = useState(String(maxStudents));
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
        trial_ends_at: trialEnd ? new Date(trialEnd).toISOString() : null,
        max_students: parseInt(maxS) || 100,
      }),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Plan selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPlan(p.value)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              plan === p.value
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className={`font-semibold text-sm ${plan === p.value ? "text-blue-700" : "text-slate-800"}`}>
              {p.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
          </button>
        ))}
      </div>

      {/* Trial settings */}
      {plan === "trial" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Trial ends on</label>
            <input
              type="date"
              value={trialEnd}
              onChange={(e) => setTrialEnd(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Max students</label>
            <input
              type="number"
              min={1}
              value={maxS}
              onChange={(e) => setMaxS(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
