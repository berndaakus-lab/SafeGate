"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Loader2, Share2, Download, RefreshCw, Check } from "lucide-react";
import Image from "next/image";
import { buildPickupPassImage } from "@/lib/pickup-pass-image";
import { Section, btnPrimary } from "@/components/ui";

type Child = { id: string; name: string; class_name: string | null };
type Person = { id: string; name: string; relation: string | null };
type QrData = { qrUrl: string; code: string; expiresAt: string; childNames: string[]; collectedBy: string };

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
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const [pass, setPass] = useState<File | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // On phones the QR appears below the fold; bring it into view once ready
  useEffect(() => {
    if (qrData) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [qrData]);

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

    const person = authorizedPeople.find((p) => p.id === personId);
    const data: QrData = {
      ...(await res.json()),
      collectedBy: person ? `${person.name}${person.relation ? ` (${person.relation})` : ""}` : "an authorised person",
    };
    setQrData(data);
    setShareNote("");
    // Build the shareable image now, so tapping Share can open the share
    // sheet immediately (iOS Safari drops the tap if we await work first).
    setPass(null);
    buildPass(data).then(setPass).catch(() => setPass(null));
  }

  // Share the pass image (WhatsApp, SMS, etc.) where the phone supports
  // sharing files; otherwise share the text, and on desktop save the image.
  async function handleShare() {
    if (!qrData) return;
    setShareNote("");
    const text = `VerifyGate pickup code for ${joinNames(qrData.childNames)}: ${qrData.code}. Show the QR code at the school gate.`;
    setSharing(true);
    try {
      const file = await getPass(qrData);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "VerifyGate pickup pass", text });
      } else if (navigator.share) {
        await navigator.share({ title: "VerifyGate pickup pass", text });
      } else {
        downloadFile(file);
        await navigator.clipboard?.writeText(text).catch(() => {});
        setShareNote("Pickup pass image saved, and the code copied. Attach the image to your message.");
      }
    } catch (err: any) {
      // The user closing the share sheet is not an error
      if (err?.name !== "AbortError") setShareNote("Could not share. Use Save Pass and send the image instead.");
    } finally {
      setSharing(false);
    }
  }

  function buildPass(data: QrData) {
    const until = new Date(data.expiresAt);
    return buildPickupPassImage({
      qrUrl: data.qrUrl,
      code: data.code,
      childNames: joinNames(data.childNames),
      collectedBy: data.collectedBy,
      validUntil: `Valid until ${until.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}, ${until.toLocaleDateString("en-GH", { weekday: "short", day: "numeric", month: "short" })}`,
    });
  }

  async function getPass(data: QrData) {
    return pass ?? (await buildPass(data));
  }

  function downloadFile(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleDownload() {
    if (!qrData) return;
    try {
      downloadFile(await getPass(qrData));
    } catch {
      setShareNote("Could not create the image. Try again.");
    }
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

      <div className="space-y-4">
        <Section
          step={1}
          title={children.length > 1 ? "Which children are being picked up?" : "Which child is being picked up?"}
          hint={children.length > 1 ? "Choose everyone this person is collecting. They all go on one QR code." : undefined}
        >
        <fieldset disabled={!hasData} className="disabled:opacity-50">
          {children.length > 1 && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setChildIds(new Set(allSelected ? [] : children.map((c) => c.id)))}
                className="text-sm font-semibold text-blue-700 hover:underline"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
          )}
          <div className="space-y-2">
            {children.map((c) => {
              const checked = childIds.has(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                    checked ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleChild(c.id)} className="sr-only" />
                  <span
                    aria-hidden
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      checked ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                    }`}
                  >
                    {checked && <Check className="w-4 h-4 text-white" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-slate-900 font-semibold truncate">{c.name}</span>
                    {c.class_name && <span className="block text-sm text-slate-500">{c.class_name}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        </Section>

        <Section step={2} title="Who is picking up?" hint="Only people on your Pickup Persons list can be chosen.">
          <fieldset disabled={!hasData} className="disabled:opacity-50">
            <legend className="sr-only">Who is picking up?</legend>
            <div className="space-y-2">
              {authorizedPeople.map((p) => {
                const chosen = personId === p.id;
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                      chosen ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input type="radio" name="pickup-person" checked={chosen} onChange={() => setPersonId(p.id)} className="sr-only" />
                    <span
                      aria-hidden
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        chosen ? "border-blue-600" : "border-slate-300 bg-white"
                      }`}
                    >
                      {chosen && <span className="w-3 h-3 rounded-full bg-blue-600" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-slate-900 font-semibold truncate">{p.name}</span>
                      {p.relation && <span className="block text-sm text-slate-500">{p.relation}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            <a href="/parent/authorized" className="inline-block mt-3 text-sm font-semibold text-blue-700 hover:underline">
              + Add someone new
            </a>
          </fieldset>
        </Section>

        {error && (
          <div role="alert" className="bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-xl border border-red-100">{error}</div>
        )}

        <button
          onClick={generate}
          disabled={childIds.size === 0 || !personId || loading}
          className={`${btnPrimary} w-full py-4 text-base`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
          {loading
            ? "Generating..."
            : childIds.size > 1
              ? `Generate QR Code for ${childIds.size} children`
              : "Generate QR Code"}
        </button>
        {hasData && (childIds.size === 0 || !personId) && (
          <p className="text-center text-sm text-slate-500">
            {childIds.size === 0 ? "Choose at least one child in step 1." : "Choose who is picking up in step 2."}
          </p>
        )}
      </div>

      {/* QR Result */}
      {qrData && (
        <div ref={resultRef} className="mt-6 bg-white rounded-2xl border-2 border-green-200 shadow-sm p-6 text-center scroll-mt-20">
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
              disabled={sharing}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share pass
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Save pass
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Shares a picture of the QR code with the children&apos;s names, so it works on WhatsApp.</p>
          {shareNote && <p className="text-xs font-medium text-slate-600 mt-2">{shareNote}</p>}

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
