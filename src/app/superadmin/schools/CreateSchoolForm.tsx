"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, School, User } from "lucide-react";

export default function CreateSchoolForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ schoolName: string; adminEmail: string } | null>(null);

  const [school, setSchool] = useState({ name: "", address: "", phone: "" });
  const [admin, setAdmin] = useState({ name: "", email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/superadmin/create-school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school, admin }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create school.");
      return;
    }

    setSuccess({ schoolName: school.name, adminEmail: admin.email });
    setSchool({ name: "", address: "", phone: "" });
    setAdmin({ name: "", email: "", password: "" });
    router.refresh();
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
          School created successfully!
        </div>
        <p className="text-green-700 text-sm">
          <strong>{success.schoolName}</strong> is live on SafeGate.
        </p>
        <p className="text-green-600 text-sm mt-1">
          Admin login: <strong>{success.adminEmail}</strong>
        </p>
        <button
          onClick={() => setSuccess(null)}
          className="mt-4 text-sm text-green-700 underline"
        >
          Add another school
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* School details */}
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
          <School className="w-4 h-4 text-blue-600" />
          School Details
        </div>
        <div className="space-y-3">
          <input
            required
            placeholder="School name *"
            value={school.name}
            onChange={(e) => setSchool({ ...school, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Address (optional)"
            value={school.address}
            onChange={(e) => setSchool({ ...school, address: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Phone number (optional)"
            value={school.phone}
            onChange={(e) => setSchool({ ...school, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* First admin */}
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
          <User className="w-4 h-4 text-purple-600" />
          First Admin Account
        </div>
        <div className="space-y-3">
          <input
            required
            placeholder="Admin full name *"
            value={admin.name}
            onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            required
            type="email"
            placeholder="Admin email *"
            value={admin.email}
            onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            required
            type="password"
            placeholder="Temporary password *"
            value={admin.password}
            onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-400">
            Share this password with the school admin. They can change it after first login.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Creating..." : "Create School & Admin"}
      </button>
    </form>
  );
}
