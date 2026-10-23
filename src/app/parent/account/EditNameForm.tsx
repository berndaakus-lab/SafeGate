"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { btnPrimary, inputBase, labelBase } from "@/components/ui";

export default function EditNameForm({ name: initial }: { name: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);
    const res = await fetch("/api/account/name", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not save your name. Try again.");
      setLoading(false);
      return;
    }
    // Re-issues the sign-in cookie so the new name shows everywhere straight away
    await update();
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="en-name" className={labelBase}>Your full name</label>
        <input id="en-name" value={name} maxLength={200} onChange={(e) => { setName(e.target.value); setSaved(false); }} className={inputBase} />
        <p className="text-xs text-slate-500 mt-1.5">This is the name the guard sees at the gate and the school keeps in its records.</p>
      </div>
      {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
      {saved && (
        <div role="status" className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
          <CheckCircle2 className="w-4 h-4" /> Name updated.
        </div>
      )}
      <button type="submit" disabled={loading || !name.trim() || name.trim() === initial} className={btnPrimary}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save name
      </button>
    </form>
  );
}
