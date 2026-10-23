"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, KeyRound } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// The school may only have had the child's name, so it saved the parent as "Parent of <child>"
const STAND_IN = /^parent of /i;

export default function FirstLoginForm({ home, askName, initialName }: { home: string; askName: boolean; initialName: string }) {
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const standIn = STAND_IN.test(initialName);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (askName && !name.trim()) return setError("Enter your full name.");
    if (askName && STAND_IN.test(name.trim())) return setError("Please type your own full name instead of \"Parent of ...\".");
    if (next.length < 8) return setError("Your new password must be at least 8 characters.");
    if (next !== confirm) return setError("The two passwords do not match.");

    setLoading(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: next, ...(askName ? { name } : {}) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not update your password. Please try again.");
      setLoading(false);
      return;
    }
    // Refresh the sign-in cookie so the corrected name shows on the next screen
    if (askName) await update();
    window.location.assign(home);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {askName && (
        <div>
          <label htmlFor="fl-name" className="block text-sm font-semibold text-slate-800 mb-1.5">Your full name</label>
          <input id="fl-name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} autoComplete="name"
            autoFocus={standIn} onFocus={(e) => standIn && e.currentTarget.select()} placeholder="Type your full name" className={inputClass} />
          <p className={`text-xs mt-1.5 ${standIn ? "text-amber-700 font-medium" : "text-slate-500"}`}>
            {standIn
              ? "The school didn't have your name, so it saved you as the name above. Please replace it with your own full name."
              : "Check that this is your full name, and correct it if not."}
          </p>
        </div>
      )}
      <div>
        <label htmlFor="fl-new" className="block text-sm font-semibold text-slate-800 mb-1.5">New password</label>
        <PasswordInput id="fl-new" value={next} onChange={(e) => setNext(e.target.value)} required
          autoComplete="new-password" placeholder="At least 8 characters" className={inputClass} />
      </div>
      <div>
        <label htmlFor="fl-confirm" className="block text-sm font-semibold text-slate-800 mb-1.5">Confirm new password</label>
        <PasswordInput id="fl-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
          autoComplete="new-password" placeholder="Re-enter new password" className={inputClass} />
      </div>
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        {loading ? "Saving..." : "Save and continue"}
      </button>
    </form>
  );
}
