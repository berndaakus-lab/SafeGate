"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Car, Loader2, Search, ShieldAlert, XCircle } from "lucide-react";

type Person = { id: string; name: string; relation: string | null; photo_url: string | null; vehicle_number: string | null };
type Child = { id: string; name: string; class_name: string | null; photo_url: string | null; persons: Person[] };

function Avatar({ url, name, size }: { url: string | null; name: string; size: number }) {
  return (
    <div className="rounded-full overflow-hidden bg-purple-600/25 text-purple-300 font-bold flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {url ? <Image src={url} alt={name} width={size} height={size} className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
    </div>
  );
}

export default function LookupClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Child[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [asked, setAsked] = useState<{ id: string; personName: string; childName: string } | null>(null);
  const [outcome, setOutcome] = useState<"waiting" | "declined" | "expired" | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  // Search a moment after the guard stops typing
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/guard/lookup?q=${encodeURIComponent(q)}`);
      const data = await res.json().catch(() => ({}));
      setSearching(false);
      setResults(res.ok ? data.children ?? [] : []);
      if (!res.ok) setError(data.error || "Search failed. Try again.");
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => () => { if (poll.current) clearInterval(poll.current); }, []);

  function stopPolling() {
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
  }

  async function ask(c: Child, p: Person) {
    setError("");
    setSending(p.id);
    const res = await fetch("/api/guard/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: c.id, personId: p.id }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(null);
    if (!res.ok) return setError(data.error || "Could not send the request.");

    setAsked({ id: data.id, personName: p.name, childName: c.name });
    setOutcome("waiting");
    stopPolling();
    poll.current = setInterval(async () => {
      const r = await fetch(`/api/guard/approval?id=${data.id}`);
      if (!r.ok) return;
      const s = await r.json();
      if (s.status === "approved" && s.code) {
        stopPolling();
        window.location.href = `/guard/verify/${encodeURIComponent(s.code)}`;
      } else if (s.status === "declined" || s.status === "expired") {
        stopPolling();
        setOutcome(s.status);
      }
    }, 3000);
  }

  function reset() {
    stopPolling();
    setAsked(null);
    setOutcome(null);
    setChild(null);
    setError("");
  }

  if (asked) {
    return (
      <div className="rounded-2xl bg-slate-800 p-6 text-center">
        {outcome === "waiting" && (
          <>
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-1">Waiting for the parent</h2>
            <p className="text-slate-300 text-sm">A message was sent to approve <strong>{asked.personName}</strong> collecting <strong>{asked.childName}</strong>. This screen opens the pickup as soon as they approve.</p>
            <p className="text-amber-300 text-sm font-semibold mt-4">Do not release the child yet.</p>
          </>
        )}
        {outcome === "declined" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-red-300 mb-1">The parent declined</h2>
            <p className="text-slate-300 text-sm">Do not release {asked.childName}. Send {asked.personName} to the school office.</p>
          </>
        )}
        {outcome === "expired" && (
          <>
            <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-amber-300 mb-1">No answer yet</h2>
            <p className="text-slate-300 text-sm">The request ran out of time. Do not release {asked.childName}. Ask the school office to phone the parent.</p>
          </>
        )}
        <button type="button" onClick={reset} className="mt-5 w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold">
          {outcome === "waiting" ? "Cancel and start again" : "Start again"}
        </button>
      </div>
    );
  }

  if (child) {
    return (
      <div>
        <button type="button" onClick={() => setChild(null)} className="text-sm text-slate-400 hover:text-white mb-3">← Different child</button>
        <div className="flex items-center gap-4 bg-slate-800 rounded-2xl p-4 mb-4">
          <Avatar url={child.photo_url} name={child.name} size={72} />
          <div className="min-w-0">
            <p className="text-lg font-bold break-words">{child.name}</p>
            {child.class_name && <p className="text-slate-400 text-sm">{child.class_name}</p>}
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-2">Who is here to collect? Compare the photo with the person in front of you.</p>
        {child.persons.length === 0 ? (
          <p className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">This parent has not added anyone yet. Do not release the child. Contact the school office.</p>
        ) : (
          <ul className="space-y-2">
            {child.persons.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => ask(child, p)} disabled={!!sending}
                  className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 rounded-2xl p-3 text-left">
                  <Avatar url={p.photo_url} name={p.name} size={64} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold break-words">{p.name}</p>
                    {p.relation && <p className="text-slate-400 text-sm">{p.relation}</p>}
                    {p.vehicle_number && <p className="inline-flex items-center gap-1 text-xs font-bold text-amber-300"><Car className="w-3 h-3" /> {p.vehicle_number}</p>}
                  </div>
                  {sending === p.id ? <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> : <span className="text-xs font-semibold text-blue-300">Ask parent</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p role="alert" className="text-sm font-medium text-red-400 mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Child's name"
          className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" />
      </div>
      {searching && <p className="text-slate-400 text-sm">Searching...</p>}
      {results && !searching && results.length === 0 && <p className="text-slate-400 text-sm">No child at your school matches that name.</p>}
      {results && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setChild(c)} className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-2xl p-3 text-left">
                <Avatar url={c.photo_url} name={c.name} size={56} />
                <div className="min-w-0">
                  <p className="font-bold break-words">{c.name}</p>
                  {c.class_name && <p className="text-slate-400 text-sm">{c.class_name}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm font-medium text-red-400 mt-3">{error}</p>}
    </div>
  );
}
