"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CalendarDays, Download, Loader2, Share2, Star, Ticket, X } from "lucide-react";
import { buildPickupPassImage } from "@/lib/pickup-pass-image";
import { copyText } from "@/lib/copy-text";
import { inputBase, labelBase } from "@/components/ui";

type Child = { id: string; name: string };
type Person = {
  id: string;
  name: string;
  relation: string | null;
  hasPhoto: boolean;
  isUsual: boolean;
  token: string | null; // null = no standing pass
  until: string | null;
  schoolDays: boolean;
  coveredIds: string[];
};

function joinNames(names: string[]) {
  return names.length <= 1 ? names[0] ?? "" : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function describe(until: string | null, schoolDays: boolean) {
  const when = until
    ? `until ${new Date(`${until}T00:00:00Z`).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`
    : "until you cancel";
  return `${when}${schoolDays ? ", school days only" : ""}`;
}

export default function PersonPassControls({ person, children, qrUrl }: { person: Person; children: Child[]; qrUrl: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"closed" | "setup" | "view">("closed");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [until, setUntil] = useState(person.until ?? "");
  const [limited, setLimited] = useState(!!person.until);
  const [schoolDays, setSchoolDays] = useState(person.schoolDays);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [freshQr, setFreshQr] = useState<string | null>(null);
  const active = !!person.token;
  const shownQr = freshQr ?? qrUrl;

  function openSetup() {
    setSelected(new Set(active ? person.coveredIds : children.map((c) => c.id)));
    setUntil(person.until ?? "");
    setLimited(!!person.until);
    setSchoolDays(person.schoolDays);
    setError("");
    setMode("setup");
  }

  async function save() {
    if (selected.size === 0) return setError("Choose at least one child.");
    if (limited && !until) return setError("Choose the last day.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/parent/standing-pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: person.id, studentIds: children.filter((c) => selected.has(c.id)).map((c) => c.id), until: limited ? until : null, schoolDays }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not save. Try again.");
    setFreshQr(data.qrUrl);
    setMode("view");
    router.refresh();
  }

  async function cancelPass() {
    if (!window.confirm(`Cancel ${person.name}'s standing pass? The pass stops working straight away, and any copy that was shared becomes useless.`)) return;
    setBusy(true);
    const res = await fetch("/api/parent/standing-pass", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: person.id }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setError(d.error || "Could not cancel. Try again.");
    }
    setFreshQr(null);
    setMode("closed");
    router.refresh();
  }

  async function setUsual(on: boolean) {
    setBusy(true);
    await fetch("/api/parent/usual-person", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: on ? person.id : null }),
    });
    setBusy(false);
    router.refresh();
  }

  async function buildImage() {
    const names = joinNames(children.filter((c) => person.coveredIds.includes(c.id) || selected.has(c.id)).map((c) => c.name));
    return buildPickupPassImage({
      qrUrl: shownQr!,
      code: person.token!,
      childNames: names,
      collectedBy: person.name,
      validUntil: `Valid ${describe(person.until, person.schoolDays)}`,
      standing: true,
    });
  }

  async function share() {
    setNote("");
    try {
      const file = await buildImage();
      const text = `VerifyGate standing pass for ${person.name}. Show the QR code at the school gate.`;
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "VerifyGate standing pass", text });
      else if (navigator.share) await navigator.share({ title: "VerifyGate standing pass", text });
      else {
        download(file);
        setNote("Saved. Attach the picture to your message.");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") setNote("Could not share. Use Save instead.");
    }
  }

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function saveImage() {
    try {
      download(await buildImage());
    } catch {
      setNote("Could not create the picture. Try again.");
    }
  }

  const groups = person.token ? person.token.replace(/(.{4})/g, "$1 ").trim() : "";

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        {active ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-100 px-2.5 py-1 rounded-full">
              <Ticket className="w-3 h-3" /> Standing pass {describe(person.until, person.schoolDays)}
            </span>
            <button type="button" onClick={() => setMode("view")} className="text-xs font-semibold text-blue-700 hover:underline">View pass</button>
            <button type="button" onClick={openSetup} className="text-xs font-semibold text-slate-600 hover:underline">Change</button>
            <button type="button" onClick={cancelPass} disabled={busy} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60">Cancel pass</button>
          </>
        ) : person.hasPhoto ? (
          <button type="button" onClick={openSetup} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 hover:bg-blue-50">
            <Ticket className="w-3 h-3" /> Set up standing pass
          </button>
        ) : (
          <span className="text-xs text-slate-500">Add a photo to set up a standing pass</span>
        )}
        <button type="button" onClick={() => setUsual(!person.isUsual)} disabled={busy} aria-pressed={person.isUsual}
          className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border ${person.isUsual ? "bg-amber-50 border-amber-300 text-amber-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
          <Star className={`w-3 h-3 ${person.isUsual ? "fill-amber-400 text-amber-500" : ""}`} /> {person.isUsual ? "Usual collector" : "Make usual collector"}
        </button>
      </div>

      {mode !== "closed" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-lg">{mode === "setup" ? `Standing pass for ${person.name}` : `${person.name}'s pass`}</h2>
              <button type="button" onClick={() => setMode("closed")} className="text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            {mode === "setup" ? (
              <div className="space-y-5">
                <p className="text-sm text-slate-600">
                  One pass that works every day, so you don&apos;t have to make a new code each time. The guard still sees the photo of whoever shows it, and you get a message at every pickup.
                </p>
                <div>
                  <p className={labelBase}>Which children can they collect?</p>
                  <div className="space-y-2">
                    {children.map((c) => (
                      <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={selected.has(c.id)} className="w-4 h-4"
                          onChange={() => setSelected((p) => { const n = new Set(p); if (!n.delete(c.id)) n.add(c.id); return n; })} />
                        <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={labelBase}>How long?</p>
                  <label className="flex items-center gap-2 text-sm text-slate-800 mb-2"><input type="radio" checked={!limited} onChange={() => setLimited(false)} /> Until I cancel it</label>
                  <label className="flex items-center gap-2 text-sm text-slate-800"><input type="radio" checked={limited} onChange={() => setLimited(true)} /> Until a date</label>
                  {limited && (
                    <div className="mt-2 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <input type="date" value={until} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setUntil(e.target.value)} className={inputBase} aria-label="Last day" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm text-slate-800 mt-3"><input type="checkbox" checked={schoolDays} onChange={(e) => setSchoolDays(e.target.checked)} /> School days only (Monday to Friday)</label>
                </div>
                {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setMode("closed")} className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
                  <button type="button" onClick={save} disabled={busy} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />} {active ? "Save changes" : "Create pass"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-3">Valid {describe(person.until, person.schoolDays)}. Send this to {person.name}. They show it at the gate every time.</p>
                {shownQr ? (
                  <div className="bg-slate-50 rounded-2xl p-3 inline-block mb-3">
                    <Image src={shownQr} alt="Standing pass QR code" width={220} height={220} className="rounded-xl" />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-3">Refresh the page to see the QR code.</p>
                )}
                <button type="button" onClick={() => copyText(person.token!).then((ok) => setNote(ok ? "Code copied." : "Couldn't copy."))}
                  className="block mx-auto font-mono text-xl font-bold tracking-widest text-slate-800 bg-slate-50 px-4 py-2 rounded-xl mb-1" title="Tap to copy">
                  {groups}
                </button>
                <p className="text-xs text-slate-500 mb-4">The guard can also type this code if the QR can&apos;t be scanned.</p>
                {shownQr && (
                  <div className="flex gap-3">
                    <button type="button" onClick={share} className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50"><Share2 className="w-4 h-4" /> Share</button>
                    <button type="button" onClick={saveImage} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"><Download className="w-4 h-4" /> Save</button>
                  </div>
                )}
                {note && <p className="text-xs font-medium text-slate-600 mt-2">{note}</p>}
                {error && <p role="alert" className="text-xs font-medium text-red-600 mt-2">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
