"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, FileText, Download, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

type Row = {
  parent_name: string;
  parent_email: string;
  parent_login_phone?: string;
  parent_phone: string;
  default_password: string;
  child_name: string;
  child_class: string;
};

type RowResult = {
  row: Row;
  status: "pending" | "ok" | "skipped" | "error";
  message: string;
};

function parseCSV(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: any = {};
    header.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj as Row;
  });
}

const TEMPLATE = `parent_name,parent_email,parent_login_phone,parent_phone,default_password,child_name,child_class
Abena Mensah,abena@email.com,,0244123456,Parent@2025,Kofi Mensah,Class 3A
Abena Mensah,abena@email.com,,0244123456,Parent@2025,Ama Mensah,Class 1B
Kwame Asante,,0277654321,0277654321,Parent@2025,Yaw Asante,Class 5C`;

const CSV_COLUMN: Record<string, string> = {
  parentName: "parent_name",
  parentEmail: "parent_email",
  parentLoginPhone: "parent_login_phone",
  parentPhone: "parent_phone",
  password: "default_password",
  childName: "child_name",
  childClass: "child_class",
};

export default function ImportParentsModal({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verifygate_parents_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setResults(parsed.map((r) => ({ row: r, status: "pending", message: "" })));
      setDone(false);
    };
    reader.readAsText(file);
  }

  async function runImport() {
    setImporting(true);
    const updated = [...results];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.parent_name || (!row.parent_email && !row.parent_login_phone) || !row.default_password) {
        updated[i] = { row, status: "error", message: "Missing name, email/login phone, or password" };
        setResults([...updated]);
        continue;
      }

      const res = await fetch("/api/admin/bulk-import-parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          parentName: row.parent_name,
          parentEmail: row.parent_email,
          parentLoginPhone: row.parent_login_phone,
          parentPhone: row.parent_phone,
          password: row.default_password,
          childName: row.child_name,
          childClass: row.child_class,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const fields: Record<string, string> = data.fields ?? {};
        const message = Object.keys(fields).length
          ? Object.entries(fields).map(([k, v]) => `${CSV_COLUMN[k] ?? k}: ${v}`).join(" ")
          : data.error || "Failed";
        updated[i] = { row, status: "error", message };
      } else if (data.parentExisted && !data.childAdded) {
        updated[i] = { row, status: "skipped", message: "Parent already exists, no child added" };
      } else if (data.parentExisted && data.childAdded) {
        updated[i] = { row, status: "ok", message: "Child added to existing parent" };
      } else {
        updated[i] = {
          row,
          status: "ok",
          message: data.childAdded ? "Parent + child created" : "Parent created",
        };
      }
      setResults([...updated]);
    }

    setImporting(false);
    setDone(true);
    router.refresh();
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const errCount = results.filter((r) => r.status === "error").length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Import from CSV
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">Import Parents from CSV</h2>
          <button onClick={() => { setOpen(false); setRows([]); setResults([]); setDone(false); }}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Template download */}
          <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-900">Use the template CSV</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Columns: parent_name, parent_email, parent_login_phone, parent_phone, default_password, child_name, child_class.
                Each parent needs an email or a login phone (or both). parent_phone is where SMS alerts go.
                One row per child; the same parent on multiple rows adds multiple children.
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 bg-white border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-50 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
          </div>

          {/* File picker */}
          <div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            >
              <FileText className="w-8 h-8 text-slate-300" />
              <span className="text-sm font-medium text-slate-600">
                {rows.length > 0 ? `${rows.length} rows loaded, click to replace` : "Click to choose CSV file"}
              </span>
            </button>
          </div>

          {/* Preview */}
          {rows.length > 0 && !done && (
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{rows.length} rows to import</p>
                {results.filter((r) => r.status !== "pending").length > 0 && (
                  <p className="text-xs text-slate-500">
                    {okCount} done · {errCount} errors
                  </p>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    {r.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />}
                    {r.status === "ok" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                    {r.status === "skipped" && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                    {r.status === "error" && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">
                        {r.row.parent_name}, {r.row.parent_email || r.row.parent_login_phone}
                        {r.row.child_name && <span className="text-slate-400"> · {r.row.child_name}</span>}
                      </p>
                      {r.message && (
                        <p className={`text-xs mt-0.5 ${r.status === "error" ? "text-red-500" : r.status === "skipped" ? "text-amber-600" : "text-green-600"}`}>
                          {r.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done summary */}
          {done && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-800">Import complete</p>
              <p className="text-sm text-green-600 mt-1">
                {okCount} row{okCount !== 1 ? "s" : ""} imported{errCount > 0 ? `, ${errCount} error${errCount !== 1 ? "s" : ""}` : ""}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => { setOpen(false); setRows([]); setResults([]); setDone(false); }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            {done ? "Close" : "Cancel"}
          </button>
          {rows.length > 0 && !done && (
            <button
              onClick={runImport}
              disabled={importing}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              {importing ? "Importing..." : `Import ${rows.length} rows`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
