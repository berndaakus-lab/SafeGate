"use client";

import { signOutUser } from "@/lib/sign-out";

export default function OfflineSignOut() {
  return (
    <button
      onClick={() => signOutUser("/login")}
      className="text-sm text-slate-400 hover:text-slate-600 underline"
    >
      Sign out
    </button>
  );
}
