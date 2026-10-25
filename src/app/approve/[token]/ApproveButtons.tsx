"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function ApproveButtons({ token, personName }: { token: string; personName: string }) {
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [result, setResult] = useState<"approved" | "declined" | null>(null);
  const [error, setError] = useState("");

  async function answer(decision: "approve" | "decline") {
    setBusy(decision);
    setError("");
    const res = await fetch(`/api/approve/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) return setResult(data.status === "approved" ? "approved" : "declined");
    if (res.status === 409 || res.status === 410) return window.location.reload(); // already answered or expired: show the real state
    setError(data.error || "Something went wrong. Please try again.");
  }

  if (result) {
    return (
      <div role="status" className={`rounded-2xl p-5 text-center ${result === "approved" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
        {result === "approved" ? <CheckCircle2 className="w-10 h-10 mx-auto mb-2" /> : <XCircle className="w-10 h-10 mx-auto mb-2" />}
        <p className="font-bold text-lg">{result === "approved" ? "Approved" : "Declined"}</p>
        <p className="text-sm mt-1">
          {result === "approved" ? `The guard can now release your child to ${personName}.` : "Your child will not be released to this person."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => answer("approve")} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-60">
        {busy === "approve" ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Yes, approve
      </button>
      <button type="button" onClick={() => answer("decline")} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 border-2 border-red-300 text-red-700 py-3.5 rounded-xl font-bold hover:bg-red-50 disabled:opacity-60">
        {busy === "decline" ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />} No, decline
      </button>
      {error && <p role="alert" className="text-sm font-medium text-red-600 text-center">{error}</p>}
    </div>
  );
}
