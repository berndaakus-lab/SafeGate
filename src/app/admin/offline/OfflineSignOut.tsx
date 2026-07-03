"use client";

import { signOut } from "next-auth/react";

export default function OfflineSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-slate-400 hover:text-slate-600 underline"
    >
      Sign out
    </button>
  );
}
