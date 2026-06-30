"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ChevronDown, GraduationCap } from "lucide-react";

export default function AddChildInline({
  parentId,
  schoolId,
  parentName,
}: {
  parentId: string;
  schoolId: string;
  parentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/parent/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, className, parentId, schoolId }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to add child. Try again.");
      return;
    }

    setSuccess(true);
    setName("");
    setClassName("");
    setOpen(false);
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  }

  return (
    <div>
      {success && (
        <p className="text-xs text-green-600 font-medium mb-2">
          ✓ Child added to {parentName}&apos;s account
        </p>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add child for {parentName}
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 shrink-0">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">New child:</span>
            </div>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Child's full name"
              className="flex-1 min-w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Class (e.g. Primary 3)"
              className="flex-1 min-w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shrink-0"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {loading ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setName(""); setClassName(""); setError(""); }}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 shrink-0"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </form>
      )}
    </div>
  );
}
