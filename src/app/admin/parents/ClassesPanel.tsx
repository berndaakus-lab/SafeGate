"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileUp, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { btnPrimary, btnSecondary, inputBase } from "@/components/ui";

type Row = { id: string; name: string; count: number };

export default function ClassesPanel({ classes }: { classes: Row[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function call(method: "POST" | "PATCH" | "DELETE", body: object) {
    setBusy(true);
    setError("");
    setNote("");
    const res = await fetch("/api/admin/classes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong. Try again.");
      return null;
    }
    router.refresh();
    return data;
  }

  async function addOne(e: React.FormEvent) {
    e.preventDefault();
    const data = await call("POST", { names: [adding] });
    if (data) {
      setAdding("");
      if (!data.added) setNote("You already have that class.");
    }
  }

  // One class per line; a line with commas is split too, so a one-column CSV or a pasted list both work
  function parseNames(text: string) {
    return text.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);
  }

  async function addBulk() {
    const names = parseNames(bulk);
    if (!names.length) return;
    const data = await call("POST", { names });
    if (data) {
      setBulk("");
      setShowBulk(false);
      setNote(`Added ${data.added} class${data.added === 1 ? "" : "es"}${data.skipped ? `, skipped ${data.skipped} you already had` : ""}.`);
    }
  }

  async function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    // Drop a header row like "class" or "class_name"
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines[0] && /^"?(class(_?name)?|name)"?$/i.test(lines[0].trim())) lines.shift();
    setBulk(lines.join("\n"));
    setShowBulk(true);
  }

  async function saveRename(id: string) {
    const data = await call("PATCH", { id, name: editName });
    if (data) setEditId(null);
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    await call("DELETE", { id: row.id });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        These are the classes your school uses. Use any names you like, such as 3A, 3B or Adehye Class. They appear in the
        class dropdowns, and a spreadsheet import adds any class it mentions that isn&apos;t here yet.
      </p>

      {classes.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {classes.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              {editId === c.id ? (
                <>
                  <input aria-label="Class name" value={editName} maxLength={100} autoFocus onChange={(e) => setEditName(e.target.value)}
                    className={`${inputBase} !py-2`} />
                  <button type="button" onClick={() => saveRename(c.id)} disabled={busy || !editName.trim()} aria-label="Save"
                    className="text-green-700 hover:text-green-800 disabled:opacity-60"><Check className="w-5 h-5" /></button>
                  <button type="button" onClick={() => setEditId(null)} aria-label="Cancel" className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.count} child{c.count === 1 ? "" : "ren"}</p>
                  </div>
                  <button type="button" onClick={() => { setEditId(c.id); setEditName(c.name); setError(""); }}
                    aria-label={`Rename ${c.name}`} className="text-slate-400 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => remove(c)} disabled={busy} aria-label={`Delete ${c.name}`}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-60"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addOne} className="flex flex-col sm:flex-row gap-2">
        <input aria-label="New class name" value={adding} maxLength={100} onChange={(e) => setAdding(e.target.value)}
          placeholder="New class, e.g. 3A or Adehye Class" className={inputBase} />
        <button type="submit" disabled={busy || !adding.trim()} className={btnPrimary}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add class
        </button>
      </form>

      <div>
        <button type="button" onClick={() => setShowBulk((v) => !v)} className="text-sm font-semibold text-blue-700 hover:underline">
          {showBulk ? "Hide list import" : "Add many at once (paste or upload a list)"}
        </button>
        {showBulk && (
          <div className="mt-3 space-y-3">
            <textarea aria-label="Class names, one per line" rows={6} value={bulk} onChange={(e) => setBulk(e.target.value)}
              placeholder={"One class per line:\n3A\n3B\nAdehye Class"} className={inputBase} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={addBulk} disabled={busy || !parseNames(bulk).length} className={btnPrimary}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Add {parseNames(bulk).length || ""} classes
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={loadFile} />
              <button type="button" onClick={() => fileRef.current?.click()} className={btnSecondary}>
                <FileUp className="w-4 h-4" /> Load from a CSV or text file
              </button>
            </div>
            <p className="text-xs text-slate-500">Classes you already have are skipped, whatever the spelling or capital letters.</p>
          </div>
        )}
      </div>

      {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
      {note && <div role="status" className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">{note}</div>}
    </div>
  );
}
