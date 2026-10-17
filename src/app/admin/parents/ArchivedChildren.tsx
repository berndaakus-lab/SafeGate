"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Loader2 } from "lucide-react";

export default function ArchivedChildren({ children }: { children: { id: string; name: string; class_name: string | null }[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function restore(id: string) {
    setBusyId(id);
    setError("");
    const res = await fetch("/api/admin/archive-student", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id, archived: false }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not restore. Try again.");
      return;
    }
    router.refresh();
  }

  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-900">
        {children.length} archived
      </summary>
      <ul className="mt-2 space-y-1.5">
        {children.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 px-3 py-2">
            <span className="min-w-0 truncate text-slate-700">
              {c.name}{c.class_name ? ` · ${c.class_name}` : ""}
            </span>
            <button type="button" onClick={() => restore(c.id)} disabled={busyId === c.id}
              className="shrink-0 inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline disabled:opacity-60">
              {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
              Restore
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-xs font-medium text-red-600 mt-2">{error}</p>}
    </details>
  );
}
