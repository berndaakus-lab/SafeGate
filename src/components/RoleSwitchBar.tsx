"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeftRight, Loader2 } from "lucide-react";

const HOME: Record<string, string> = {
  parent: "/parent/dashboard",
  admin: "/admin/dashboard",
  guard: "/guard/scan",
  teacher: "/guard/scan",
};

const SIDE: Record<string, string> = {
  parent: "My children",
  admin: "School admin",
  guard: "Gate scanner",
  teacher: "Gate scanner",
};

/**
 * For staff who are also parents: one sign-in, two sides. Shows only when the
 * school has linked this staff account to a parent profile. The server checks
 * that link again on every switch.
 */
export default function RoleSwitchBar({ dark = false }: { dark?: boolean }) {
  const { data: session, update } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const user = session?.user as any;
  const switchTo: string | null = user?.switchTo ?? null;
  if (!switchTo || !HOME[switchTo]) return null;
  const target: string = switchTo;

  async function go() {
    setBusy(true);
    setError("");
    const next = await update({ switchTo: target === "parent" ? "parent" : "staff" });
    if ((next?.user as any)?.role !== target) {
      setBusy(false);
      setError("Couldn't switch. Your school may have changed your account; sign in again.");
      return;
    }
    // A full load, so every page on the other side reads the new sign-in
    window.location.assign(HOME[target]);
  }

  return (
    <div className={`px-4 sm:px-6 py-2.5 border-b ${dark ? "bg-slate-800 border-slate-700" : "bg-indigo-50 border-indigo-100"}`}>
      <div className="flex items-center gap-3 max-w-4xl">
        <p className={`flex-1 min-w-0 text-sm ${dark ? "text-slate-300" : "text-indigo-900"}`}>
          You&apos;re on <strong>{SIDE[user.role] ?? user.role}</strong>
        </p>
        <button
          type="button"
          onClick={go}
          disabled={busy}
          className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
            dark ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
          Switch to {SIDE[target]}
        </button>
      </div>
      {error && <p role="alert" className={`text-xs font-medium mt-1.5 ${dark ? "text-red-300" : "text-red-600"}`}>{error}</p>}
    </div>
  );
}
