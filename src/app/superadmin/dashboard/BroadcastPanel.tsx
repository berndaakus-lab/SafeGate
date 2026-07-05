"use client";

import { useState } from "react";
import { Radio, Send } from "lucide-react";

interface Props {
  schools: { id: string; name: string }[];
}

export default function BroadcastPanel({ schools }: Props) {
  const [schoolId, setSchoolId] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/superadmin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: schoolId === "all" ? null : schoolId, title, body }),
      });
      const data = await res.json();
      setResult(res.ok ? `Sent to ${data.sent ?? 0} parent(s)` : data.error ?? "Failed");
      if (res.ok) { setTitle(""); setBody(""); }
    } catch {
      setResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <select
        value={schoolId}
        onChange={(e) => setSchoolId(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All schools</option>
        {schools.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Notification title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="Message body..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSend}
        disabled={loading || !title.trim() || !body.trim()}
        className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        {loading ? (
          <Radio className="w-4 h-4 animate-pulse" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {loading ? "Sending..." : "Send Broadcast"}
      </button>
      {result && (
        <p className={`text-xs text-center font-medium ${result.startsWith("Sent") ? "text-green-600" : "text-red-500"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
