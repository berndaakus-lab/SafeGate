"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, X, Check } from "lucide-react";

type Staff = { id: string; name: string; email: string; role: string };

const roleColors: Record<string, string> = {
  admin: "bg-blue-100 text-blue-700",
  guard: "bg-green-100 text-green-700",
  teacher: "bg-purple-100 text-purple-700",
};

export default function StaffList({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<{ name: string; email: string; role: string }>({ name: "", email: "", role: "guard" });

  function startEdit(s: Staff) {
    setEditingId(s.id);
    setDraft({ name: s.name, email: s.email, role: s.role });
    setError("");
  }

  async function save(id: string) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/superadmin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save.");
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this staff account? This cannot be undone.")) return;
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/superadmin/staff/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete.");
      return;
    }
    router.refresh();
  }

  if (!staff.length) {
    return <p className="px-6 py-8 text-sm text-slate-400 text-center">No staff accounts yet.</p>;
  }

  return (
    <div className="divide-y divide-slate-50">
      {error && <p className="px-6 py-2 text-xs text-red-500">{error}</p>}
      {staff.map((s) => (
        <div key={s.id} className="px-6 py-3">
          {editingId === s.id ? (
            <div className="flex flex-col gap-2">
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                placeholder="Name"
              />
              <input
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                placeholder="Email"
              />
              <select
                value={draft.role}
                onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
              >
                <option value="admin">Admin</option>
                <option value="guard">Guard</option>
                <option value="teacher">Teacher</option>
              </select>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => save(s.id)}
                  disabled={busyId === s.id}
                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs font-medium px-3 py-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                <p className="text-xs text-slate-400 truncate">{s.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColors[s.role] ?? "bg-slate-100 text-slate-600"}`}>
                  {s.role}
                </span>
                <button onClick={() => startEdit(s)} className="text-slate-400 hover:text-blue-600 p-1">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(s.id)} disabled={busyId === s.id} className="text-slate-400 hover:text-red-600 p-1 disabled:opacity-50">
                  {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
