"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Search } from "lucide-react";
import { btnPrimary, inputBase } from "@/components/ui";

type Candidate = { id: string; name: string; class_name: string | null };

/**
 * Type to filter the school's unlinked students and link one to this parent.
 * `onNone` fires when the list is empty so the form can fall back to typing a new child.
 */
export default function PickStudent({
  parentId,
  parentName,
  onLinked,
  onNone,
}: {
  parentId: string;
  parentName: string;
  onLinked: () => void;
  onNone: () => void;
}) {
  const router = useRouter();
  const [students, setStudents] = useState<Candidate[] | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/unlinked-students")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list: Candidate[] = d.students ?? [];
        setStudents(list);
        if (!list.length) onNone();
      })
      .catch(() => alive && setError("Could not load your student list."));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = students ?? [];
    return (q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all).slice(0, 8);
  }, [students, query]);

  async function link() {
    if (!picked) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/link-student", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: picked.id, parentId }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not link the child. Try again.");
      return;
    }
    onLinked();
    router.refresh();
  }

  if (students === null) {
    return <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading your student list...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input autoFocus type="search" aria-label="Search the student list" value={query}
          onChange={(e) => { setQuery(e.target.value); setPicked(null); }}
          placeholder={`Type the child's name (${students.length} not yet linked)`} className={`${inputBase} !pl-10`} />
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-slate-500">No unlinked student matches &quot;{query}&quot;.</p>
      ) : (
        <ul role="listbox" aria-label="Students" className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {results.map((s) => (
            <li key={s.id} role="option" aria-selected={picked?.id === s.id}>
              <button type="button" onClick={() => setPicked(s)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 ${picked?.id === s.id ? "bg-blue-50" : ""}`}>
                <span className="font-semibold text-slate-900 truncate">{s.name}</span>
                {s.class_name && (
                  <span className="text-xs text-slate-500 inline-flex items-center gap-1 shrink-0"><GraduationCap className="w-3.5 h-3.5" /> {s.class_name}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}

      <button type="button" onClick={link} disabled={!picked || loading} className={btnPrimary}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {picked ? `Link ${picked.name} to ${parentName.split(" ")[0]}` : "Pick a child above"}
      </button>
    </div>
  );
}
