"use client";

import { useState } from "react";
import { CheckCircle2, Flag, Loader2, X } from "lucide-react";
import { inputBase, labelBase } from "@/components/ui";

export default function ReportCorrectionButton({ studentId, name }: { studentId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/parent/report-correction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, message }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not send. Try again.");
      return;
    }
    setOpen(false);
    setMessage("");
    setSent(true);
  }

  if (sent) {
    return (
      <p role="status" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="w-3.5 h-3.5" /> Sent to the school. They will fix it.
      </p>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700">
        <Flag className="w-3.5 h-3.5" /> Wrong name or class?
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-900 text-lg">Report a mistake</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Only the school can change {name}&apos;s name or class. Tell them what is wrong and they will fix it.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`rc-${studentId}`} className={labelBase}>What should it say?</label>
                <textarea id={`rc-${studentId}`} rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Her class should be Class 4A, not Class 3A" className={inputBase} />
              </div>
              {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading || message.trim().length < 3}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
