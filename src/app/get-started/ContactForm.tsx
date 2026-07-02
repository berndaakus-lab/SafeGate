"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter (Free trial)",
  school: "School Plan — GHS 150/mo",
  enterprise: "Enterprise (Custom)",
};

export default function ContactForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") || "";

  const [form, setForm] = useState({ school: "", name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/demo-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_name: form.school,
        contact_name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        plan: planParam || "starter",
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Something went wrong. Please try again or WhatsApp us directly.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h3 className="font-bold text-slate-900 text-xl mb-2">Request received!</h3>
        <p className="text-slate-500 text-sm">
          Thank you, <strong>{form.name}</strong>. We&apos;ll reach out to{" "}
          <strong>{form.email}</strong> within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {planParam && PLAN_LABELS[planParam] && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium">
          Interested in: {PLAN_LABELS[planParam]}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">School name *</label>
        <input
          required
          value={form.school}
          onChange={set("school")}
          placeholder="e.g. Innova Montessori School"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Your name *</label>
        <input
          required
          value={form.name}
          onChange={set("name")}
          placeholder="Principal / Administrator"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@school.edu.gh"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
          <input
            value={form.phone}
            onChange={set("phone")}
            placeholder="0244 ..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Anything you&apos;d like to know?</label>
        <textarea
          value={form.message}
          onChange={set("message")}
          rows={3}
          placeholder="Number of students, questions about pricing, specific requirements..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Sending..." : "Request Demo — It's Free"}
      </button>
      <p className="text-xs text-center text-slate-400">No commitment. We&apos;ll contact you to schedule a walkthrough.</p>
    </form>
  );
}
