"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";

export default function ResetStaffPassword({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function reset() {
    if (!window.confirm(`Give ${staffName} a new temporary password? Their current password will stop working.`)) return;
    setLoading(true);
    setError("");
    setCopied(false);
    const res = await fetch("/api/admin/reset-staff-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not reset the password. Try again.");
      return;
    }
    setPassword(data.password);
  }

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setError("Couldn't copy. Select the password and copy it by hand.");
    }
  }

  return (
    <div className="mt-3 sm:pl-[3.75rem]">
      {password ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-900 mb-2">New temporary password for {staffName}. It won&apos;t be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-base font-bold tracking-wide text-slate-900 bg-white border border-amber-200 rounded-lg px-3 py-1.5 select-all break-all">{password}</code>
            <button type="button" onClick={copy} aria-label="Copy password"
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-amber-900 mt-2">Give it only to {staffName}, privately. They must choose their own password when they sign in.</p>
        </div>
      ) : (
        <button type="button" onClick={reset} disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 disabled:opacity-60">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />} Reset password
        </button>
      )}
      {error && <p role="alert" className="text-xs font-medium text-red-600 mt-2">{error}</p>}
    </div>
  );
}
