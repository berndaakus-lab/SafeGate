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
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Pricing</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter Plan</p>
            <Field label="Price" value={data.plan_starter_price ?? ""} onChange={set("plan_starter_price")} placeholder="Free" />
            <Field label="Period note" value={data.plan_starter_note ?? ""} onChange={set("plan_starter_note")} placeholder="first month" />
          </div>
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">School Plan</p>
            <Field label="Price" value={data.plan_school_price ?? ""} onChange={set("plan_school_price")} placeholder="GHS 150" />
            <Field label="Period note" value={data.plan_school_note ?? ""} onChange={set("plan_school_note")} placeholder="per month" />
          </div>
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise Plan</p>
            <Field label="Price" value={data.plan_enterprise_price ?? ""} onChange={set("plan_enterprise_price")} placeholder="Custom" />
            <Field label="Period note" value={data.plan_enterprise_note ?? ""} onChange={set("plan_enterprise_note")} placeholder="contact us" />
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
