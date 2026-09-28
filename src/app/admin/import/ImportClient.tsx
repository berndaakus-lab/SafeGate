"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";

type Row = { studentName: string; className: string; parentLogin: string; status?: "ok" | "error" | "pending"; message?: string };

const TEMPLATE = "Student Name,Class,Parent Email or Phone\nKwame Asante,Primary 3,parent@example.com\nAkosua Mensah,KG 2,0244123456";

function parseCSV(text: string): Row[] {
  const lines = text.trim().split("\n").filter(Boolean);
  // skip header
  return lines.slice(1).map((line) => {
    const [studentName = "", className = "", parentLogin = ""] = line.split(",").map((s) => s.trim());
    return { studentName, className, parentLogin };
  }).filter((r) => r.studentName && r.parentLogin);
}

export default function ImportClient({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (!parsed.length) {
        setError("No valid rows found. Check your CSV format.");
        return;
      }
      setError("");
      setRows(parsed.map((r) => ({ ...r, status: "pending" })));
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "verifygate-students-template.csv";
    a.click();
  }

  async function runImport() {
    setLoading(true);
    const updated = [...rows];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      try {
        const res = await fetch("/api/admin/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schoolId,
            studentName: row.studentName,
            className: row.className,
            parentLogin: row.parentLogin,
          }),
        });
        const data = await res.json();
        updated[i] = { ...row, status: res.ok ? "ok" : "error", message: res.ok ? undefined : data.error };
      } catch {
        updated[i] = { ...row, status: "error", message: "Network error" };
      }
      setRows([...updated]);
    }

    setLoading(false);
    setDone(true);
    router.refresh();
  }

  const successCount = rows.filter((r) => r.status === "ok").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Bulk Import Students</h1>
        <p className="text-slate-500 mt-1">
          Upload a CSV with student names, classes, and each parent&apos;s email or login phone. Students are linked to parents automatically.
        </p>
      </div>

      {/* Step 1: Download template */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Step 1: Download template</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill it in with your school&apos;s student list</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>

        <div className="mt-4 bg-slate-50 rounded-xl p-3 font-mono text-xs text-slate-500 overflow-x-auto">
          <p>Student Name, Class, Parent Email or Phone</p>
          <p>Kwame Asante, Primary 3, parent@example.com</p>
          <p>Akosua Mensah, KG 2, 0244123456</p>
        </div>
        <p className="text-xs text-amber-600 mt-2">
          Note: Parent accounts must already exist in VerifyGate. Students are matched by the parent&apos;s email or login phone.
        </p>
      </div>

      {/* Step 2: Upload */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-4">
        <h2 className="font-semibold text-slate-900 text-sm mb-3">Step 2: Upload your CSV</h2>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        <button
          onClick={() => { fileRef.current?.click(); setDone(false); setRows([]); }}
          className="w-full flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl py-8 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
        >
          <Upload className="w-8 h-8 text-slate-400" />
          <span className="text-sm text-slate-500">Click to choose CSV file</span>
        </button>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* Preview + import */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">{rows.length} students ready to import</h2>
            {!done && (
              <div className="flex gap-2">
                <button onClick={() => setRows([])} className="text-xs text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={runImport}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {loading ? "Importing..." : "Import All"}
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-50">
            {rows.map((row, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{row.studentName}</p>
                  <p className="text-xs text-slate-400 truncate">{row.className ? `${row.className} · ` : ""}{row.parentLogin}</p>
                </div>
                {row.status === "ok" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                {row.status === "error" && (
                  <span className="flex items-center gap-1 text-xs text-red-500 shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" /> {row.message}
                  </span>
                )}
                {row.status === "pending" && loading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
              </div>
            ))}
          </div>

          {done && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm text-slate-700">
                <strong>{successCount}</strong> imported{errorCount > 0 ? `, ${errorCount} failed` : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
