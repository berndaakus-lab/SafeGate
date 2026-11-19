"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartHandshake, Loader2, Search, Unlink, X } from "lucide-react";

type Candidate = { id: string; name: string; login: string; childCount: number };
type Linked = { id: string; name: string; childNames: string[] };

/**
 * "Also a parent" on a staff row: link the staff sign-in to a parent profile,
 * so a teacher who is a parent signs in once and switches between the scanner
 * and their children.
 */
export default function AlsoParentControl({
  staff,
  linked,
  candidates,
}: {
  staff: { id: string; name: string; loginPhone: string | null };
  linked: Linked | null;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<string>("new");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Most likely the same person: same name, or the parent login is the staff phone
  const suggested = useMemo(
    () =>
      candidates.filter(
        (c) => c.name.trim().toLowerCase() === staff.name.trim().toLowerCase() || (!!staff.loginPhone && c.login.includes(staff.loginPhone)),
      ),
    [candidates, staff],
  );
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggested;
    return candidates.filter((c) => c.name.toLowerCase().includes(q) || c.login.toLowerCase().includes(q)).slice(0, 20);
  }, [candidates, suggested, query]);

  function openModal() {
    setQuery("");
    setChoice(suggested[0]?.id ?? "new");
    setError("");
    setOpen(true);
  }

  async function link() {
    const existing = choice !== "new" ? candidates.find((c) => c.id === choice) : null;
    if (existing && !window.confirm(
      `Link ${existing.name} to ${staff.name}'s staff account?\n\n${existing.name}'s own parent sign-in (${existing.login || "none"}) will stop working. ${staff.name} will sign in with their staff details and switch to "My children".`,
    )) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/staff-parent-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: staff.id, ...(existing ? { parentId: existing.id } : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not link. Try again.");
    setOpen(false);
    router.refresh();
  }

  async function unlink() {
    if (!linked) return;
    if (!window.confirm(
      `Stop linking ${staff.name} to the parent profile "${linked.name}"?\n\nThe parent profile and its children stay, but nobody can sign in to it until you give it a login phone or email (Edit on the Parents page).`,
    )) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/staff-parent-link", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: staff.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not unlink. Try again.");
    router.refresh();
  }

  if (linked) {
    return (
      <div className="mt-3 sm:pl-[3.75rem]">
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2">
          <HeartHandshake className="w-4 h-4 text-indigo-600 shrink-0" />
          <p className="flex-1 min-w-0 text-sm text-indigo-900">
            <strong>Also a parent</strong>
            {linked.childNames.length
              ? ` of ${linked.childNames.join(", ")}`
              : ". No children yet: add them on the Parents page."}
          </p>
          <Link href="/admin/parents" className="text-xs font-semibold text-indigo-700 hover:underline">Parents page</Link>
          <button type="button" onClick={unlink} disabled={busy}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60">
            <Unlink className="w-3.5 h-3.5" /> Unlink
          </button>
        </div>
        {error && <p role="alert" className="text-xs font-medium text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={openModal}
        className="mt-3 sm:ml-[3.75rem] inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 border-2 border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50">
        <HeartHandshake className="w-4 h-4" /> Also a parent?
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-lg">{staff.name} is also a parent</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {staff.name} keeps one sign-in (their staff phone or email and password). In the app they tap
              <strong> Switch to My children</strong> to see their own children and pickup passes.
            </p>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-slate-800 mb-2">Their children are…</legend>
              <label className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 cursor-pointer ${choice === "new" ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
                <input type="radio" name="parent-choice" checked={choice === "new"} onChange={() => setChoice("new")} className="mt-1" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Not in the app yet</span>
                  <span className="block text-xs text-slate-500">Make a parent profile for {staff.name}, then add the children on the Parents page.</span>
                </span>
              </label>

              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-500 mb-1.5">Or already added under a parent account:</p>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search parents by name or phone"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                {shown.length === 0 ? (
                  <p className="text-xs text-slate-500">{query ? "No parent matches." : "Type to find their parent account."}</p>
                ) : (
                  shown.map((c) => (
                    <label key={c.id} className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 mb-2 cursor-pointer ${choice === c.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
                      <input type="radio" name="parent-choice" checked={choice === c.id} onChange={() => setChoice(c.id)} className="mt-1" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900 truncate">{c.name}</span>
                        <span className="block text-xs text-slate-500 truncate">
                          {[c.login, `${c.childCount} child${c.childCount === 1 ? "" : "ren"}`].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>

            {choice !== "new" && (
              <p className="mt-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                That parent account&apos;s own sign-in will stop working. {staff.name} uses the staff sign-in for both.
              </p>
            )}
            {error && <div role="alert" className="mt-3 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={link} disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Link as parent
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
