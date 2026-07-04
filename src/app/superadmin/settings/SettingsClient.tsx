"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, DollarSign, Phone, Share2 } from "lucide-react";
import type { Settings } from "@/lib/settings";

function Field({
  label, value, onChange, placeholder, prefix,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center">
        {prefix && (
          <span className="px-3 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 px-4 py-3 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${prefix ? "rounded-r-xl" : "rounded-xl"}`}
        />
      </div>
    </div>
  );
}

export default function SettingsClient({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [data, setData] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set(key: string) {
    return (v: string) => setData((d) => ({ ...d, [key]: v }));
  }

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/superadmin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-slate-500 mt-1">Control pricing, contact details, and social links shown on the public site.</p>
      </div>

      {/* Pricing */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Pricing Tiers</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          For internal use and proposals only — prices are not shown publicly. Annual = 10× monthly (2 months free).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3 bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Standard</p>
            <p className="text-xs text-slate-400 -mt-1">Up to 100 students</p>
            <Field label="Monthly price" value={data.tier_standard_monthly ?? ""} onChange={set("tier_standard_monthly")} placeholder="GHS 150" />
            <Field label="Annual price" value={data.tier_standard_annual ?? ""} onChange={set("tier_standard_annual")} placeholder="GHS 1,500" />
          </div>
          <div className="space-y-3 bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Growth ★ Most Popular</p>
            <p className="text-xs text-slate-400 -mt-1">101 – 500 students</p>
            <Field label="Monthly price" value={data.tier_growth_monthly ?? ""} onChange={set("tier_growth_monthly")} placeholder="GHS 250" />
            <Field label="Annual price" value={data.tier_growth_annual ?? ""} onChange={set("tier_growth_annual")} placeholder="GHS 2,500" />
          </div>
          <div className="space-y-3 bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Premier</p>
            <p className="text-xs text-slate-400 -mt-1">500+ students</p>
            <Field label="Monthly price" value={data.tier_premier_monthly ?? ""} onChange={set("tier_premier_monthly")} placeholder="GHS 400" />
            <Field label="Annual price" value={data.tier_premier_annual ?? ""} onChange={set("tier_premier_annual")} placeholder="GHS 4,000" />
          </div>
          <div className="space-y-3 bg-slate-900 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">International ★ Premium</p>
            <p className="text-xs text-slate-400 -mt-1">Any size · international / private schools</p>
            <Field label="Monthly price" value={data.tier_international_monthly ?? ""} onChange={set("tier_international_monthly")} placeholder="GHS 800" />
            <Field label="Annual price" value={data.tier_international_annual ?? ""} onChange={set("tier_international_annual")} placeholder="GHS 8,000" />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
            <Phone className="w-4 h-4 text-green-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Contact Details</h2>
        </div>
        <div className="space-y-4">
          <Field
            label="WhatsApp number (international format, no +)"
            value={data.whatsapp ?? ""}
            onChange={set("whatsapp")}
            placeholder="233244123456"
            prefix="+"
          />
          <Field label="Email address" value={data.email ?? ""} onChange={set("email")} placeholder="hello@verifygate.app" />
          <Field label="Phone number" value={data.phone ?? ""} onChange={set("phone")} placeholder="+233 24 412 3456" />
        </div>
      </section>

      {/* Socials */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <Share2 className="w-4 h-4 text-purple-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Social Links</h2>
        </div>
        <div className="space-y-4">
          <Field label="Facebook" value={data.facebook ?? ""} onChange={set("facebook")} placeholder="https://facebook.com/verifygate" prefix="fb" />
          <Field label="Instagram" value={data.instagram ?? ""} onChange={set("instagram")} placeholder="https://instagram.com/verifygate" prefix="ig" />
          <Field label="Twitter / X" value={data.twitter ?? ""} onChange={set("twitter")} placeholder="https://x.com/verifygate" prefix="x" />
          <Field label="LinkedIn" value={data.linkedin ?? ""} onChange={set("linkedin")} placeholder="https://linkedin.com/company/verifygate" prefix="in" />
        </div>
      </section>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Saved!
          </span>
        )}
      </div>
    </div>
  );
}
