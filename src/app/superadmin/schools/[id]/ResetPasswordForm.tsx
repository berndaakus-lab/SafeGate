"use client";

import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";

export default function ResetPasswordForm({ staff }: { staff: { id: string; name: string; email: string }[] }) {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/superadmin/reset-staff-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, newPassword: password }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to reset password.");
      return;
    }

    setSuccess(true);
    setStaffId(""); setPassword("");
    setTimeout(() => setSuccess(false), 3000);
  }

  if (!staff.length) return <p className="text-sm text-slate-400">No staff accounts to reset.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Staff member</label>
          <select required value={staffId} onChange={(e) => setStaffId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select staff...</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}, {s.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="New temporary password"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">Password reset successfully!</div>}

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}
