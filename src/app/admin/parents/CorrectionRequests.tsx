"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, Loader2 } from "lucide-react";

type Request = { id: string; studentName: string; className: string | null; parentName: string; message: string };

export default function CorrectionRequests({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function resolve(id: string) {
    setBusyId(id);
    setError("");
    const res = await fetch("/api/admin/resolve-correction", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not update. Try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-semibold text-amber-900">
        <Flag className="w-4 h-4" /> {requests.length} correction request{requests.length === 1 ? "" : "s"} from parents
      </h2>
      <p className="text-sm text-amber-900/80 mt-1 mb-4">
        Fix the child with the pencil on their card below, then mark the request done.
      </p>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {r.studentName}{r.className ? ` · ${r.className}` : ""}
                <span className="font-normal text-slate-500"> (from {r.parentName})</span>
              </p>
              <p className="text-sm text-slate-700 mt-0.5 break-words">{r.message}</p>
            </div>
            <button type="button" onClick={() => resolve(r.id)} disabled={busyId === r.id}
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline disabled:opacity-60">
              {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Done
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-sm font-medium text-red-600 mt-3">{error}</p>}
    </div>
  );
}
