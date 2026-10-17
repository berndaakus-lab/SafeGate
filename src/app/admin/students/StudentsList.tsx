"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, GraduationCap, Link2Off, Search } from "lucide-react";
import StudentPhotoButton from "@/components/StudentPhotoButton";
import EditChildButton from "@/app/admin/parents/EditChildButton";
import { Badge, inputBase } from "@/components/ui";

export type StudentRow = {
  id: string;
  name: string;
  class_name: string | null;
  photo_url: string | null;
  parent_id: string | null;
  parentName: string | null;
  archived: boolean;
};

const PAGE = 100;

export default function StudentsList({ students, levels }: { students: StudentRow[]; levels: string[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unlinked" | "linked" | "archived">("all");
  const [cls, setCls] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const q = query.trim().toLowerCase();
  const matches = students.filter((s) => {
    if (filter === "archived" ? !s.archived : s.archived) return false;
    if (filter === "unlinked" && s.parent_id) return false;
    if (filter === "linked" && !s.parent_id) return false;
    if (cls && (s.class_name ?? "") !== cls) return false;
    return !q || `${s.name} ${s.parentName ?? ""}`.toLowerCase().includes(q);
  });
  const shown = matches.slice(0, limit);

  const active = students.filter((s) => !s.archived);
  const counts = {
    all: active.length,
    unlinked: active.filter((s) => !s.parent_id).length,
    linked: active.filter((s) => s.parent_id).length,
    archived: students.length - active.length,
  };
  const classOptions = [...new Set(active.map((s) => s.class_name).filter(Boolean) as string[])].sort(
    (a, b) => (levels.indexOf(a) + 1 || 999) - (levels.indexOf(b) + 1 || 999) || a.localeCompare(b, undefined, { numeric: true })
  );

  async function call(url: string, body: object, id: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(id);
    setError("");
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong. Try again.");
      return;
    }
    router.refresh();
  }

  const tabs: { key: typeof filter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "unlinked", label: `Not linked (${counts.unlinked})` },
    { key: "linked", label: `Linked (${counts.linked})` },
    ...(counts.archived ? [{ key: "archived" as const, label: `Archived (${counts.archived})` }] : []),
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Filter students">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={filter === t.key} onClick={() => { setFilter(t.key); setLimit(PAGE); }}
            className={`text-sm font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
              filter === t.key ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="search" aria-label="Search students" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
            placeholder="Search by student or parent name" className={`${inputBase} !pl-10`} />
        </div>
        <select aria-label="Filter by class" value={cls} onChange={(e) => { setCls(e.target.value); setLimit(PAGE); }} className={`${inputBase} sm:w-56`}>
          <option value="">All classes</option>
          {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && <div role="alert" className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

      {matches.length === 0 ? (
        <p className="text-sm text-slate-500 px-1 py-6">
          {students.length === 0 ? "No students yet. Add one below or import your list." : "No student matches."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {shown.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
              <StudentPhotoButton studentId={s.id} name={s.name} photoUrl={s.photo_url} endpoint="/api/admin/student-photo" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  {s.class_name && (
                    <span className="text-xs text-slate-500 inline-flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {s.class_name}</span>
                  )}
                  {s.parent_id ? (
                    <span className="text-xs text-slate-600">Parent: {s.parentName ?? "linked"}</span>
                  ) : (
                    !s.archived && <Badge tone="amber">Not linked to a parent</Badge>
                  )}
                </div>
              </div>
              {s.archived ? (
                <button type="button" disabled={busyId === s.id} onClick={() => call("/api/admin/archive-student", { studentId: s.id, archived: false }, s.id)}
                  className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline disabled:opacity-60">
                  <ArchiveRestore className="w-4 h-4" /> Restore
                </button>
              ) : (
                <>
                  {s.parent_id && (
                    <button type="button" disabled={busyId === s.id} aria-label={`Unlink ${s.name} from ${s.parentName ?? "parent"}`}
                      onClick={() => call("/api/admin/link-student", { studentId: s.id, parentId: null }, s.id,
                        `Unlink ${s.name} from ${s.parentName ?? "their parent"}? The parent will stop seeing this child until you link them again.`)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 disabled:opacity-60">
                      <Link2Off className="w-4 h-4" />
                    </button>
                  )}
                  <EditChildButton student={s} levels={levels} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {matches.length > shown.length && (
        <button type="button" onClick={() => setLimit((n) => n + PAGE)}
          className="mt-4 w-full text-sm font-semibold text-blue-700 hover:underline py-2">
          Show more ({matches.length - shown.length} left)
        </button>
      )}
    </div>
  );
}
