"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { btnPrimary, inputBase } from "@/components/ui";
import ClassSelect from "@/components/ClassSelect";

export default function MoveClassesPanel({ classes, levels }: { classes: { name: string; count: number }[]; levels: string[] }) {
  const router = useRouter();
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const moves = classes
    .map((c) => ({ from: c.name, to: (targets[c.name] ?? "").trim(), count: c.count }))
    .filter((m) => m.to && m.to !== m.from);
  const total = moves.reduce((n, m) => n + m.count, 0);

  async function apply() {
    const summary = moves.map((m) => `${m.from} → ${m.to} (${m.count})`).join("\n");
    if (!window.confirm(`Move ${total} child${total === 1 ? "" : "ren"}?\n\n${summary}`)) return;
    setLoading(true);
    setError("");
    setDone("");
    const res = await fetch("/api/admin/move-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moves: moves.map(({ from, to }) => ({ from, to })) }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not move the classes. Try again.");
      return;
    }
    setTargets({});
    setDone(`Moved ${data.moved} child${data.moved === 1 ? "" : "ren"}.`);
    router.refresh();
  }

  if (!classes.length) {
    return <p className="text-sm text-slate-500">No children have a class yet. Set one with the pencil on a child.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Pick the new class next to each class that is moving. Leave it on &quot;Keep as it is&quot; for classes that stay.
        All moves apply together, so you can move Class 3 to 4 and Class 4 to 5 in one go.
      </p>
      <div className="space-y-2">
        {classes.map((c) => (
          <div key={c.name} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="sm:w-48 shrink-0">
              <p className="font-semibold text-slate-900 truncate">{c.name}</p>
              <p className="text-xs text-slate-500">{c.count} child{c.count === 1 ? "" : "ren"}</p>
            </div>
            <ArrowRight className="hidden sm:block w-4 h-4 text-slate-400 shrink-0" />
            <ClassSelect aria-label={`New class for ${c.name}`} levels={levels} value={targets[c.name] ?? ""}
              onChange={(e) => setTargets((t) => ({ ...t, [c.name]: e.target.value }))}
              emptyLabel="Keep as it is" className={inputBase} />
          </div>
        ))}
      </div>
      {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
      {done && <div role="status" className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">{done}</div>}
      <button type="button" onClick={apply} disabled={loading || !moves.length} className={btnPrimary}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {moves.length ? `Move ${total} child${total === 1 ? "" : "ren"}` : "Move classes"}
      </button>
    </div>
  );
}
