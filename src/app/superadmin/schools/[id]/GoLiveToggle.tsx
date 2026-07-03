"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power } from "lucide-react";

export default function GoLiveToggle({
  schoolId,
  isActive,
}: {
  schoolId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/superadmin/schools/${schoolId}/toggle-active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !active }),
    });
    setLoading(false);
    if (!res.ok) { setError("Failed to update. Try again."); return; }
    setActive((v) => !v);
    router.refresh();
  }

  return (
    <div className="flex items-start gap-4">
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
          active ? "bg-green-500 focus:ring-green-400" : "bg-slate-300 focus:ring-slate-400"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 flex items-center justify-center ${
            active ? "translate-x-7" : "translate-x-0"
          }`}
        >
          {loading && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
        </span>
      </button>
      <div>
        <div className="flex items-center gap-2">
          <Power className={`w-4 h-4 ${active ? "text-green-600" : "text-slate-400"}`} />
          <p className={`font-semibold text-sm ${active ? "text-green-700" : "text-slate-500"}`}>
            {active ? "School is LIVE" : "School is OFFLINE"}
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {active
            ? "All staff, guards and parents can log in and use VerifyGate."
            : "All logins for this school are blocked. Users see an offline notice with your contact."}
        </p>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}
