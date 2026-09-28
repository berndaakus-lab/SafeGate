"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";

export default function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);

  function handleClick() {
    if (!window.confirm("Sign out of the scanner? You'll need to sign in again to scan pickups.")) return;
    setBusy(true);
    signOut({ callbackUrl: "/login" });
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      aria-label="Sign out"
      className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      <span className={compact ? "hidden sm:inline" : undefined}>Sign out</span>
    </button>
  );
}
