"use client";

import { useState } from "react";
import { QrCode, Loader2, Share2, Download, RefreshCw, Check } from "lucide-react";
import Image from "next/image";

type Child = { id: string; name: string; class_name: string | null };
type Person = { id: string; name: string; relation: string | null };
type QrData = { qrUrl: string; code: string; expiresAt: string; childNames: string[] };

function joinNames(names: string[]) {
  return names.length <= 1 ? names[0] ?? "" : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export default function GenerateForm({
  children,
  authorizedPeople,
}: {
  children: Child[];
  authorizedPeople: Person[];
}) {
  const initialChildren = () => new Set(children.length === 1 ? [children[0].id] : []);
  const [childIds, setChildIds] = useState<Set<string>>(initialChildren);
  const [personId, setPersonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [error, setError] = useState("");

  const allSelected = children.length > 0 && childIds.size === children.length;

  function toggleChild(id: string) {
    setChildIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function generate() {
    if (childIds.size === 0 || !personId) return;
    setError("");
    setLoading(true);
    setQrData(null);

    // Keep the order the children are listed in, not the order they were tapped
    const studentIds = children.filter((c) => childIds.has(c.id)).map((c) => c.id);
    const res = await fetch("/api/pickup/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds, authorizedPersonId: personId }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to generate code. Please try again.");
      return;
    }

    setQrData(await res.json());
  }

  function handleShare() {
    if (!qrData) return;
    if (navigator.share) {
      navigator.share({
        title: "VerifyGate Pickup Code",
        text: `Pickup code for ${joinNames(qrData.childNames)}: ${qrData.code}`,
      });
    } else {
      navigator.clipboard.writeText(qrData.code);
      alert("Code copied to clipboard!");
    }
  }

  async function handleDownload() {
    if (!qrData?.qrUrl) return;
    const a = document.createElement("a");
    a.href = qrData.qrUrl;
    a.download = "verifygate-pickup-qr.png";
    a.click();
  }

  const hasData = children.length > 0 && authorizedPeople.length > 0;
  const missingChild = children.length === 0;
  const missingPerson = authorizedPeople.length === 0;

  return (
    <div>
      {missingChild && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl text-sm mb-4">
          <p className="font-semibold mb-1">No children added yet</p>
          <p className="mb-3">Your school admin needs to add your child to your account, or you can add them yourself.</p>
          <a href="/parent/children" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            Go to My Children →
          </a>
        </div>
      )}
      {!missingChild && missingPerson && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl text-sm mb-4">
          <p className="font-semibold mb-1">No pickup persons added yet</p>
          <p className="mb-3">Add the people who are authorised to collect your child, family members, drivers, etc.</p>
          <a href="/parent/authorized" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            Add Pickup Persons →
          </a>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <fieldset disabled={!hasData} className="disabled:opacity-50">
          <div className="flex items-center justify-between mb-1.5">
            <p className="block text-sm font-medium text-slate-700">
              {children.length > 1 ? "Which children?" : "Which child?"} <span className="text-red-500">*</span>
            </p>
            {children.length > 1 && (
              <button
                type="button"
                onClick={() => setChildIds(new Set(allSelected ? [] : children.map((c) => c.id)))}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                {allSelected ? "Clear" : "Select all"}
              </button>
            )}
          </div>
          {children.length > 1 && (
            <p className="text-xs text-slate-400 mb-2">Choose everyone this person is collecting. They all go on one QR code.</p>
          )}
          <div className="space-y-2">
            {children.map((c) => {
              const checked = childIds.has(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                    checked ? "border-blue-500 bg-blue-50/60" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleChild(c.id)} className="sr-only" />
                  <span
                    aria-hidden
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      checked ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-slate-900 font-medium truncate">{c.name}</span>
                    {c.class_name && <span className="block text-xs text-slate-500">{c.class_name}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Who is picking up? <span className="text-red-500">*</span>
          </label>
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            disabled={!hasData}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
          >
            <option value="">Select a person...</option>
            {authorizedPeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.relation ? ` (${p.relation})` : ""}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
        )}

        <button
          onClick={generate}
          disabled={childIds.size === 0 || !personId || loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
          {loading
            ? "Generating..."
            : childIds.size > 1
              ? `Generate QR Code for ${childIds.size} children`
              : "Generate QR Code"}
        </button>
      </div>

      {/* QR Result */}
      {qrData && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Valid until {new Date(qrData.expiresAt).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })} today
          </div>

          <p className="text-sm text-slate-600 mb-4">
            For <strong className="text-slate-900">{joinNames(qrData.childNames)}</strong>
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 inline-block mb-5">
            <Image
              src={qrData.qrUrl}
              alt="Pickup QR Code"
              width={200}
              height={200}
              className="rounded-xl"
            />
          </div>

          <p className="text-xs text-slate-400 mb-2">Pickup code (tap to copy)</p>
          <button
            onClick={() => navigator.clipboard.writeText(qrData.code)}
            title="Tap to copy"
            className="font-mono text-3xl font-bold tracking-[0.3em] text-slate-800 mb-6 bg-slate-50 px-6 py-3 rounded-xl inline-block hover:bg-slate-100 transition-colors cursor-copy"
          >
            {qrData.code}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Save QR
            </button>
          </div>

          <button
            onClick={() => { setQrData(null); setChildIds(initialChildren()); setPersonId(""); }}
            className="flex items-center justify-center gap-2 w-full mt-3 text-slate-400 text-sm hover:text-slate-600 py-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Generate another
          </button>
        </div>
      )}
    </div>
  );
}
