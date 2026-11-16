"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { PERIOD_LABEL, type BillingMonths } from "@/lib/subscription";
import { formatDate } from "@/lib/utils";

type Phase = "idle" | "loading" | "pending" | "polling" | "paid" | "failed" | "error";
type Period = { months: BillingMonths; amount: number };

const fmt = (n: number) => n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SubscribeForm({ periods }: { periods: Period[] }) {
  const [months, setMonths] = useState<BillingMonths>(periods[0]?.months ?? 1);
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [ref, setRef] = useState("");
  const [paidUntil, setPaidUntil] = useState<string | null>(null);
  // Set when the network texts a code that must be entered (Paystack "send_otp")
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState("");

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpBusy(true);
    setOtpError("");
    const res = await fetch("/api/payment/submit-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: ref, otp }),
    });
    const data = await res.json().catch(() => ({}));
    setOtpBusy(false);
    if (!res.ok) {
      setOtpError(data.error || "That code didn't work. Try again.");
      return;
    }
    setNeedsOtp(false);
    setMessage(data.message || "Code accepted. Approve the prompt on your phone if one appears.");
  }

  const selected = periods.find((p) => p.months === months) ?? periods[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("loading");
    setMessage("");

    // Only the period is sent; the server works out the amount itself
    const res = await fetch("/api/payment/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, months }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error || "Payment initiation failed.");
      setPhase("error");
      return;
    }

    setRef(data.reference);
    setNeedsOtp(!!data.requiresOtp);
    setOtp("");
    setOtpError("");
    setMessage(data.message || "Check your phone and approve the payment prompt.");
    setPhase("pending");
  }

  async function checkPayment() {
    setPhase("polling");
    const res = await fetch(`/api/payment/verify?reference=${encodeURIComponent(ref)}`);
    const data = await res.json().catch(() => ({}));

    if (data.status === "paid") {
      setPaidUntil(data.paidUntil ?? null);
      setPhase("paid");
    } else if (data.status === "failed") {
      setMessage(data.reason ? `Payment failed: ${data.reason}. Please try again.` : "Payment was declined or failed. Please try again.");
      setPhase("failed");
    } else {
      setMessage("Still waiting for payment confirmation. Approve the prompt on your phone, then check again.");
      setPhase("pending");
    }
  }

  if (phase === "paid") {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="font-bold text-slate-900 text-xl mb-2">Payment confirmed!</h3>
        <p className="text-slate-500 text-sm mb-6">
          {paidUntil ? `Your school is paid up until ${formatDate(paidUntil)}.` : "Your subscription is active."}
        </p>
        <Link href="/admin/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (phase === "pending" && needsOtp) {
    return (
      <form onSubmit={submitOtp} className="text-center py-6">
        <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h3 className="font-bold text-slate-900 text-lg mb-2">Enter the code from the SMS</h3>
        <p className="text-slate-500 text-sm mb-4">{message}</p>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="Code"
          className="w-40 mx-auto block text-center tracking-widest px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {otpError && <p className="text-sm text-red-600 mt-3">{otpError}</p>}
        <button
          type="submit"
          disabled={otpBusy || !otp}
          className="mt-4 flex items-center gap-2 mx-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {otpBusy && <Loader2 className="w-4 h-4 animate-spin" />}
          {otpBusy ? "Sending..." : "Submit code"}
        </button>
        <button type="button" onClick={() => setPhase("idle")} className="mt-3 text-sm text-slate-400 hover:text-slate-600">
          Use a different number
        </button>
      </form>
    );
  }

  if (phase === "pending" || phase === "polling") {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h3 className="font-bold text-slate-900 text-lg mb-2">Approve on your phone</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <button
          onClick={checkPayment}
          disabled={phase === "polling"}
          className="flex items-center gap-2 mx-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {phase === "polling" && <Loader2 className="w-4 h-4 animate-spin" />}
          {phase === "polling" ? "Checking..." : "I've approved, check payment"}
        </button>
        <p className="text-xs text-slate-400 mt-4">
          Closed this page by mistake? A confirmed payment is still applied automatically within the hour.
        </p>
        <button onClick={() => setPhase("idle")} className="mt-3 text-sm text-slate-400 hover:text-slate-600">
          Use a different number
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 mb-2">How long do you want to pay for?</legend>
        <div className="grid grid-cols-2 gap-2">
          {periods.map((p) => {
            const active = p.months === months;
            return (
              <button
                key={p.months}
                type="button"
                onClick={() => setMonths(p.months)}
                aria-pressed={active}
                className={`relative text-left rounded-xl border-2 px-4 py-3 transition-colors ${
                  active ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {active && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
                <span className="block text-sm font-semibold text-slate-900">{PERIOD_LABEL[p.months]}</span>
                <span className="block text-xs text-slate-500 mt-0.5 tabular-nums">GHS {fmt(p.amount)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="momo" className="block text-sm font-medium text-slate-700 mb-1.5">MoMo phone number</label>
        <input
          id="momo"
          required
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0244 123 456"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">MTN, Telecel (Vodafone), or AirtelTigo</p>
      </div>

      <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-slate-600">Total for {PERIOD_LABEL[selected.months]}</span>
        <span className="font-bold text-slate-900 tabular-nums">GHS {fmt(selected.amount)}</span>
      </div>

      {(phase === "error" || phase === "failed") && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={phase === "loading"}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {phase === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {phase === "loading" ? "Sending payment prompt..." : `Pay GHS ${fmt(selected.amount)} via MoMo`}
      </button>
    </form>
  );
}
