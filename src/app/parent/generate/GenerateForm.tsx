"use client";

import { useState } from "react";
import { QrCode, Loader2, Share2, Download, RefreshCw } from "lucide-react";
import Image from "next/image";

type Child = { id: string; name: string; class_name: string | null };
type Person = { id: string; name: string; relation: string | null };

export default function GenerateForm({
  children,
  authorizedPeople,
}: {
  children: Child[];
  authorizedPeople: Person[];
}) {
  const [childId, setChildId] = useState("");
  const [personId, setPersonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{ qrUrl: string; code: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!childId || !personId) return;
    setError("");
    setLoading(true);
    setQrData(null);

    const res = await fetch("/api/pickup/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: childId, authorizedPersonId: personId }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to generate code. Please try again.");
      return;
    }

    const data = await res.json();
    setQrData(data);
  }

  function handleShare() {
    if (!qrData) return;
    if (navigator.share) {
      navigator.share({
        title: "SafeGate Pickup Code",
        text: `Use this code to pick up the child: ${qrData.code}`,
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
    a.download = "safegate-pickup-qr.png";
    a.click();
  }

  const hasData = children.length > 0 && authorizedPeople.length > 0;

  return (
    <div>
      {!hasData && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 px-5 py-4 rounded-2xl text-sm mb-6">
          <p className="font-medium mb-1">Setup needed</p>
          <p>Please add at least one child and one authorized pickup person before generating a code.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Which child? <span className="text-red-500">*</span>
          </label>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            disabled={!hasData}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
          >
            <option value="">Select a child...</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.class_name ? ` — ${c.class_name}` : ""}
              </option>
            ))}
          </select>
        </div>

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
          disabled={!childId || !personId || loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
          {loading ? "Generating..." : "Generate QR Code"}
        </button>
      </div>

      {/* QR Result */}
      {qrData && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Valid until {new Date(qrData.expiresAt).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })} today
          </div>

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
            onClick={() => { setQrData(null); setChildId(""); setPersonId(""); }}
            className="flex items-center justify-center gap-2 w-full mt-3 text-slate-400 text-sm hover:text-slate-600 py-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Generate another
          </button>
        </div>
      )}
    </div>
  );
}
