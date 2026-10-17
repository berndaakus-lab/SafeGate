"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X } from "lucide-react";
import { inputBase, labelBase } from "@/components/ui";

const relations = ["Parent", "Uncle", "Aunt", "Grandparent", "Driver", "Sibling", "Family Friend", "Other"];

export default function EditPersonButton({
  person,
  nameLocked,
}: {
  person: { id: string; name: string; phone: string | null; relation: string | null };
  nameLocked: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(person.name);
  const [phone, setPhone] = useState(person.phone ?? "");
  const [relation, setRelation] = useState(person.relation ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const options = person.relation && !relations.includes(person.relation) ? [...relations, person.relation] : relations;

  function openModal() {
    setName(person.name);
    setPhone(person.phone ?? "");
    setRelation(person.relation ?? "");
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/parent/authorized", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: person.id, name, phone, relation }),
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

  return (
    <>
      <button type="button" onClick={openModal} aria-label={`Edit ${person.name}`}
        className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 text-lg">Edit pickup person</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`ep-name-${person.id}`} className={labelBase}>Full name</label>
                <input id={`ep-name-${person.id}`} value={name} onChange={(e) => setName(e.target.value)}
                  disabled={nameLocked} className={`${inputBase} disabled:bg-slate-100 disabled:text-slate-500`} />
                {nameLocked && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    The name is locked because this person has already collected a child, so the school&apos;s records stay accurate.
                    If it is a different person, add them as a new pickup person.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={`ep-phone-${person.id}`} className={labelBase}>Phone number</label>
                <input id={`ep-phone-${person.id}`} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0244123456" className={inputBase} />
              </div>
              <div>
                <label htmlFor={`ep-rel-${person.id}`} className={labelBase}>Relationship</label>
                <select id={`ep-rel-${person.id}`} value={relation} onChange={(e) => setRelation(e.target.value)} className={inputBase}>
                  <option value="">Select...</option>
                  {options.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
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
          </div>
        </div>
      )}
    </>
  );
}
