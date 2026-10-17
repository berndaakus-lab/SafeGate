"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, CheckCircle2, ImageOff, Loader2, Maximize2, X } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { PickupChild } from "@/lib/pickup-codes";

export default function ConfirmPickup({ pickupCodeId, childList }: { pickupCodeId: string; childList: PickupChild[] }) {
  const router = useRouter();
  const pending = childList.filter((c) => !c.pickedUpAt);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(pending.map((c) => c.id)));
  const [loading, setLoading] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [zoomed, setZoomed] = useState<PickupChild | null>(null);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoomed(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

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

    const res = await fetch("/api/pickup/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickupCodeId, studentIds: [...selected] }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to confirm pickup. Please try again.");
      return;
    }

    setConfirmedCount(selected.size);
    setTimeout(() => router.push("/guard/scan"), 3000);
  }

  if (confirmedCount !== null) {
    return (
      <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-green-300 mb-1">Pickup Confirmed!</h2>
        <p className="text-green-400/70 text-sm">
          {confirmedCount} {confirmedCount === 1 ? "child" : "children"} logged. Redirecting to scanner...
        </p>
      </div>
    );
  }

  const multi = childList.length > 1;

  return (
    <div>
      {zoomed?.photo_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${zoomed.name}'s photo`}
          onClick={() => setZoomed(null)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 gap-4"
        >
          <Image
            src={zoomed.photo_url}
            alt={zoomed.name}
            width={640}
            height={640}
            className="w-full max-w-[min(90vw,28rem)] aspect-square object-cover rounded-3xl"
          />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{zoomed.name}</p>
            {zoomed.class_name && <p className="text-slate-300">{zoomed.class_name}</p>}
          </div>
          <button
            type="button"
            onClick={() => setZoomed(null)}
            className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-3.5 rounded-2xl"
          >
            <X className="w-5 h-5" /> Close
          </button>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            {multi ? `Children (${childList.length})` : "Child"}
          </p>
          {multi && pending.length > 0 && <p className="text-xs text-slate-500">Untick any child not leaving now</p>}
        </div>
        <ul className="space-y-3">
          {childList.map((c) => {
            const done = !!c.pickedUpAt;
            const checked = selected.has(c.id);
            const details = (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-white leading-snug break-words">{c.name}</p>
                  {c.class_name && <p className="text-slate-300 text-sm">{c.class_name}</p>}
                  {done ? (
                    <p className="text-amber-400 text-xs mt-1">
                      Already picked up at {formatTime(c.pickedUpAt!)}{c.releasedBy ? ` by ${c.releasedBy}` : ""}
                    </p>
                  ) : !c.photo_url ? (
                    <p className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <ImageOff className="w-3 h-3" /> No photo on file
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">Tap photo to enlarge</p>
                  )}
                </div>
                {multi && !done && (
                  <span
                    aria-hidden
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                      checked ? "bg-green-600 border-green-600" : "border-slate-500"
                    }`}
                  >
                    {checked && <Check className="w-5 h-5 text-white" />}
                  </span>
                )}
              </>
            );
            return (
              <li key={c.id} className={`flex items-center gap-4 rounded-xl p-2 ${done ? "opacity-50" : ""}`}>
                {c.photo_url ? (
                  <button
                    type="button"
                    onClick={() => setZoomed(c)}
                    aria-label={`Enlarge ${c.name}'s photo`}
                    className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 ring-2 ring-slate-600 hover:ring-blue-400 focus:outline-none focus:ring-blue-400 transition"
                  >
                    <Image src={c.photo_url} alt={c.name} width={224} height={224} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    </span>
                  </button>
                ) : (
                  <div className="w-28 h-28 rounded-2xl shrink-0 bg-slate-700 border-2 border-dashed border-slate-500 flex flex-col items-center justify-center text-slate-300">
                    <span className="text-3xl font-bold">{c.name[0]?.toUpperCase()}</span>
                  </div>
                )}
                {multi && !done ? (
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={checked}
                    aria-label={`${checked ? "Untick" : "Tick"} ${c.name}`}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-xl p-2 -m-2 hover:bg-slate-700/50 transition-colors"
                  >
                    {details}
                  </button>
                ) : (
                  <div className="flex-1 min-w-0 flex items-center gap-3">{details}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {error && (
        <div className="bg-red-900/30 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-800/50 mb-4">{error}</div>
      )}
      <button
        onClick={confirm}
        disabled={loading || selected.size === 0}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            {multi ? `Confirm pickup (${selected.size} of ${pending.length})` : "Confirm Pickup"}
          </>
        )}
      </button>
      <p className="text-center text-slate-500 text-xs mt-3">
        Tap only after verifying the person&apos;s identity
      </p>
    </div>
  );
}
