"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ConfirmPickup({
  pickupCodeId,
  studentId,
  authorizedPersonId,
}: {
  pickupCodeId: string;
  studentId: string;
  authorizedPersonId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/pickup/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickupCodeId, studentId, authorizedPersonId }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to confirm pickup. Please try again.");
      return;
    }

    setConfirmed(true);
    setTimeout(() => router.push("/guard/scan"), 3000);
  }

  if (confirmed) {
    return (
      <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-green-300 mb-1">Pickup Confirmed!</h2>
        <p className="text-green-400/70 text-sm">Pickup logged. Redirecting to scanner...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-900/30 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-800/50 mb-4">
          {error}
        </div>
      )}
      <button
        onClick={confirm}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</>
        ) : (
          <><CheckCircle2 className="w-5 h-5" /> Confirm Pickup</>
        )}
      </button>
      <p className="text-center text-slate-500 text-xs mt-3">
        Tap only after verifying the person&apos;s identity
      </p>
    </div>
  );
}
