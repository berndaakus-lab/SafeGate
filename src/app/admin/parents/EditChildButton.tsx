"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, Pencil, X } from "lucide-react";
import { inputBase, labelBase } from "@/components/ui";

export default function EditChildButton({
  student,
}: {
  student: { id: string; name: string; class_name: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(student.name);
  const [className, setClassName] = useState(student.class_name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setName(student.name);
    setClassName(student.class_name ?? "");
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/update-student", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, name, className }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save. Try again.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function archive() {
    if (!window.confirm(`Archive ${student.name}? They will be hidden from the parent and can no longer be picked up. Pickup history is kept, and you can restore them later.`)) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/archive-student", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, archived: true }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not archive. Try again.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={openModal} aria-label={`Edit ${student.name}`}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-700 hover:bg-white">
        <Pencil className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 text-lg">Edit child</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`ec-name-${student.id}`} className={labelBase}>Name</label>
                <input id={`ec-name-${student.id}`} value={name} onChange={(e) => setName(e.target.value)} className={inputBase} />
              </div>
              <div>
                <label htmlFor={`ec-class-${student.id}`} className={labelBase}>Class / grade</label>
                <input id={`ec-class-${student.id}`} value={className} onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Class 4A" className={inputBase} />
              </div>
              {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save
                </button>
              </div>
            </form>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <button type="button" onClick={archive} disabled={loading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline disabled:opacity-60">
                <Archive className="w-4 h-4" /> Archive this child (left or graduated)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
