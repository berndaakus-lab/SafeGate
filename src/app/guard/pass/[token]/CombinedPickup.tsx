"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Car, Check, CheckCircle2, Loader2, Users } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { PickupChild } from "@/lib/pickup-codes";

export type Family = {
  pickupCodeId: string;
  parentName: string;
  personName: string;
  relation: string | null;
  vehicle: string | null;
  photoUrl: string | null;
  children: PickupChild[];
};

export default function CombinedPickup({ families, personName }: { families: Family[]; personName: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(families.flatMap((f) => f.children.filter((c) => !c.pickedUpAt).map((c) => c.id)))
  );
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<number | null>(null);
  const [error, setError] = useState("");

  const pendingCount = families.reduce((n, f) => n + f.children.filter((c) => !c.pickedUpAt).length, 0);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirm() {
    if (selected.size === 0) return;
    setLoading(true);
    setError("");
    let done = 0;
    const failed: string[] = [];
    // One confirmation per family, so each parent gets their own message and log
    for (const f of families) {
      const ids = f.children.filter((c) => selected.has(c.id) && !c.pickedUpAt).map((c) => c.id);
      if (!ids.length) continue;
      const res = await fetch("/api/pickup/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupCodeId: f.pickupCodeId, studentIds: ids }),
      });
      if (res.ok) done += ids.length;
      else failed.push(f.children.filter((c) => ids.includes(c.id)).map((c) => c.name).join(", "));
    }
    setLoading(false);
    if (failed.length) {
      setError(`Could not confirm: ${failed.join("; ")}. ${done ? `${done} confirmed. ` : ""}Refresh the page and check before releasing anyone.`);
      if (done) router.refresh();
      return;
    }
    setConfirmed(done);
    setTimeout(() => router.push("/guard/scan"), 3000);
  }

  if (confirmed !== null) {
    return (
      <Shell>
        <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-green-300 mb-1">Pickup Confirmed!</h2>
          <p className="text-green-400/70 text-sm">
            {confirmed} {confirmed === 1 ? "child" : "children"} from {families.length} families logged. Redirecting to scanner...
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-400 text-sm font-medium">Pass valid</span>
        <span className="text-xs font-semibold text-blue-300 bg-blue-500/15 border border-blue-500/30 rounded-full px-2.5 py-0.5">Shared pass</span>
      </div>

      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
        <Users className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-100">
          <strong>{personName}</strong> collects for <strong>{families.length} families</strong>. Check each person&apos;s photo against who is here, then untick any child not leaving now.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {families.map((f) => (
          <section key={f.pickupCodeId} className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold text-purple-400 shrink-0">
                {f.photoUrl ? <Image src={f.photoUrl} alt={f.personName} width={64} height={64} className="w-full h-full object-cover" /> : f.personName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white break-words">{f.personName}</p>
                <p className="text-slate-400 text-xs">{f.relation ? `${f.relation} · ` : ""}Parent: {f.parentName}</p>
                {f.vehicle && (
                  <p className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-300"><Car className="w-3 h-3" /> {f.vehicle}</p>
                )}
              </div>
            </div>
            <ul className="space-y-2">
              {f.children.map((c) => {
                const done = !!c.pickedUpAt;
                const checked = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={done}
                      onClick={() => toggle(c.id)}
                      aria-pressed={checked}
                      className={`w-full flex items-center gap-3 rounded-xl p-2 text-left ${done ? "opacity-50" : "hover:bg-slate-700/50"}`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
                        {c.photo_url ? <Image src={c.photo_url} alt={c.name} width={128} height={128} className="w-full h-full object-cover" /> : c.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white break-words">{c.name}</p>
                        {c.class_name && <p className="text-slate-300 text-xs">{c.class_name}</p>}
                        {done && <p className="text-amber-400 text-xs">Picked up at {formatTime(c.pickedUpAt!)}</p>}
                      </div>
                      {!done && (
                        <span aria-hidden className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 ${checked ? "bg-green-600 border-green-600" : "border-slate-500"}`}>
                          {checked && <Check className="w-5 h-5 text-white" />}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {error && <div role="alert" className="bg-red-900/30 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-800/50 mb-4">{error}</div>}
      <button
        onClick={confirm}
        disabled={loading || selected.size === 0}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-60"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</> : <><CheckCircle2 className="w-5 h-5" /> Confirm all ({selected.size} of {pendingCount})</>}
      </button>
      <p className="text-center text-slate-500 text-xs mt-3">Tap only after verifying the person&apos;s identity</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/guard/scan" className="flex items-center gap-2">
          <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white">VerifyGate</span>
        </Link>
        <Link href="/guard/scan" className="text-slate-400 text-sm hover:text-white">← Scan again</Link>
      </header>
      <main className="flex-1 px-5 py-6">
        <div className="w-full max-w-sm mx-auto">{children}</div>
      </main>
    </div>
  );
}
