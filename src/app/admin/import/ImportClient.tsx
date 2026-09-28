"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Loader2, FileText, RotateCcw } from "lucide-react";
import { parseCsvRecords } from "@/lib/csv";

type Row = {
  line: number;
  parent_name: string;
  parent_email: string;
  parent_login_phone: string;
  parent_phone: string;
  default_password: string;
  child_name: string;
  child_class: string;
};

type Status = "pending" | "ok" | "skipped" | "error";
type Result = { status: Status; message: string };

const TEMPLATE = `parent_name,parent_email,parent_login_phone,parent_phone,default_password,child_name,child_class
Abena Mensah,abena@email.com,,0244123456,Parent@2025,Kofi Mensah,Class 3A
Abena Mensah,abena@email.com,,0244123456,Parent@2025,Ama Mensah,Class 1B
Kwame Asante,,0277654321,0277654321,Parent@2025,Yaw Asante,Class 5C`;

// Friendlier or older header names that mean the same column.
const HEADER_ALIASES: Record<string, string> = {
  name: "parent_name",
  email: "parent_email",
  login_phone: "parent_login_phone",
  phone: "parent_phone",
  sms_phone: "parent_phone",
  password: "default_password",
  student_name: "child_name",
  student: "child_name",
  child: "child_name",
  class: "child_class",
  student_class: "child_class",
  parent_email_or_phone: "parent_contact",
};

const API_FIELD_TO_COLUMN: Record<string, string> = {
  parentName: "parent_name",
  parentEmail: "parent_email",
  parentLoginPhone: "parent_login_phone",
  parentPhone: "parent_phone",
  password: "default_password",
  childName: "child_name",
  childClass: "child_class",
};

const COLUMNS: { name: string; when: string; note: string }[] = [
  { name: "parent_name", when: "New parents", note: "The parent's full name." },
  { name: "parent_email", when: "Email or login phone", note: "What the parent signs in with. Fill in one or both." },
  { name: "parent_login_phone", when: "Email or login phone", note: "Any format works: 0244123456, 233244123456, +233 24 412 3456." },
  { name: "parent_phone", when: "Optional", note: "Where pickup SMS alerts go. Can be the same as the login phone." },
  { name: "default_password", when: "New parents", note: "At least 8 characters. Share it with the parent." },
  { name: "child_name", when: "Optional", note: "One child per row. Repeat the parent on another row for more children." },
  { name: "child_class", when: "Optional", note: "e.g. Primary 3, KG 2." },
];

function toRows(text: string): Row[] {
  return parseCsvRecords(text, HEADER_ALIASES).map((r, i) => {
    const contact = r.parent_contact ?? "";
    return {
      line: i + 2,
      parent_name: r.parent_name ?? "",
      parent_email: r.parent_email || (contact.includes("@") ? contact : ""),
      parent_login_phone: r.parent_login_phone || (contact && !contact.includes("@") ? contact : ""),
      parent_phone: r.parent_phone ?? "",
      default_password: r.default_password ?? "",
      child_name: r.child_name ?? "",
      child_class: r.child_class ?? "",
    };
  });
}

export default function ImportClient({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [fileError, setFileError] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [counts, setCounts] = useState({ parents: 0, children: 0, skipped: 0, errors: 0 });

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "verifygate-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setRows([]); setResults([]); setFileName(""); setFileError("");
    setDone(false); setOnlyProblems(false); setProgress(0);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    reset();
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = toRows(String(reader.result ?? ""));
      if (!parsed.length) {
        setFileError("No rows found. Check that the file is a CSV with a header row, like the template.");
        return;
      }
      setFileName(file.name);
      setRows(parsed);
      setResults(parsed.map(() => ({ status: "pending", message: "" })));
    };
    reader.onerror = () => setFileError("That file could not be read.");
    reader.readAsText(file);
  }

  async function importRow(row: Row): Promise<Result & { parentCreated?: boolean; childAdded?: boolean }> {
    if (!row.parent_email && !row.parent_login_phone) {
      return { status: "error", message: "Needs a parent_email or parent_login_phone." };
    }
    try {
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fields: Record<string, string> = data.fields ?? {};
        const message = Object.keys(fields).length
          ? [...new Set(Object.entries(fields).map(([k, v]) => `${API_FIELD_TO_COLUMN[k] ?? k}: ${v}`))].join(" ")
          : data.error || "Failed";
        return { status: "error", message };
      }
      const parts = [
        data.parentCreated ? "Parent created" : "Existing parent",
        data.childAdded ? "child added" : data.childExisted ? "child already added" : null,
      ].filter(Boolean);
      const nothingNew = !data.parentCreated && !data.childAdded;
      return {
        status: nothingNew ? "skipped" : "ok",
        message: parts.join(", ") + (nothingNew ? " (nothing to change)" : ""),
        parentCreated: data.parentCreated,
        childAdded: data.childAdded,
      };
    } catch {
      return { status: "error", message: "Network error. Check your connection and import again." };
    }
  }

  async function runImport() {
    setImporting(true);
    const updated = [...results];
    const tally = { parents: 0, children: 0, skipped: 0, errors: 0 };

    for (let i = 0; i < rows.length; i++) {
      const r = await importRow(rows[i]);
      updated[i] = { status: r.status, message: r.message };
      if (r.parentCreated) tally.parents++;
      if (r.childAdded) tally.children++;
      if (r.status === "skipped") tally.skipped++;
      if (r.status === "error") tally.errors++;
      setResults([...updated]);
      setProgress(i + 1);
    }

    setCounts(tally);
    setImporting(false);
    setDone(true);
    if (tally.errors) setOnlyProblems(true);
    router.refresh();
  }

  const visible = rows
    .map((row, i) => ({ row, result: results[i] }))
    .filter(({ result }) => !onlyProblems || result?.status === "error");

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Import Parents &amp; Students</h1>
        <p className="text-slate-500 mt-1">
          Set up parents and their children from one spreadsheet. Each row is one child with their parent&apos;s details.
          To add a single parent instead, use the Parents page.
        </p>
      </div>

      {/* Step 1 */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Step 1: Download the template</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill it in, or export these columns from your school management system.</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Download template
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Column</th>
                <th className="text-left font-semibold px-4 py-2.5">Required for</th>
                <th className="text-left font-semibold px-4 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {COLUMNS.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700 whitespace-nowrap">{c.name}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{c.when}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-slate-500 list-disc pl-4">
          <li>Parents who already have an account only need their email or login phone plus the child. Their saved details won&apos;t change.</li>
          <li>Re-uploading the same file is safe. Parents and children already added are skipped, not duplicated.</li>
        </ul>
      </section>

      {/* Step 2 */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 mb-4">
        <h2 className="font-semibold text-slate-900 text-sm mb-3">Step 2: Upload your CSV</h2>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-8 hover:border-blue-300 hover:bg-blue-50/30 transition-colors disabled:opacity-50"
        >
          {fileName ? <FileText className="w-8 h-8 text-blue-500" /> : <Upload className="w-8 h-8 text-slate-400" />}
          <span className="text-sm text-slate-600 font-medium">
            {fileName ? `${fileName}, ${rows.length} row${rows.length !== 1 ? "s" : ""}. Click to choose a different file.` : "Click to choose a CSV file"}
          </span>
          <span className="text-xs text-slate-400">In Excel: File, Save As, CSV UTF-8</span>
        </button>
        {fileError && <p role="alert" className="text-xs font-medium text-red-600 mt-2">{fileError}</p>}
      </section>

      {/* Step 3 */}
      {rows.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900 text-sm">
              {importing
                ? `Importing ${progress} of ${rows.length}...`
                : done
                  ? "Import finished"
                  : `Step 3: Review and import ${rows.length} row${rows.length !== 1 ? "s" : ""}`}
            </h2>
            <div className="flex items-center gap-3">
              {done && counts.errors > 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
                  Show only rows with problems
                </label>
              )}
              {done ? (
                <button onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
                  <RotateCcw className="w-3.5 h-3.5" /> Import another file
                </button>
              ) : (
                <button
                  onClick={runImport}
                  disabled={importing}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? "Importing..." : "Import all"}
                </button>
              )}
            </div>
          </div>

          {done && (
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: "Parents created", value: counts.parents, tone: "text-green-700" },
                { label: "Children added", value: counts.children, tone: "text-green-700" },
                { label: "Already existed", value: counts.skipped, tone: "text-amber-600" },
                { label: "Rows with problems", value: counts.errors, tone: counts.errors ? "text-red-600" : "text-slate-400" },
              ].map((s) => (
                <div key={s.label}>
                  <p className={`text-xl font-bold tabular-nums ${s.tone}`}>{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          {done && counts.errors > 0 && (
            <p className="px-6 py-3 text-xs text-slate-500 border-b border-slate-50">
              Fix the rows below in your spreadsheet and upload the whole file again. Rows that already went in will be skipped.
            </p>
          )}

          <div className="divide-y divide-slate-50 max-h-[32rem] overflow-y-auto">
            {visible.map(({ row, result }) => (
              <div key={row.line} className="flex items-start gap-3 px-6 py-3">
                <span className="text-xs text-slate-300 tabular-nums w-10 shrink-0 pt-0.5">#{row.line}</span>
                <div className="pt-0.5 shrink-0">
                  {(!result || result.status === "pending") &&
                    (importing ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />)}
                  {result?.status === "ok" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {result?.status === "skipped" && <AlertCircle className="w-4 h-4 text-amber-500" />}
                  {result?.status === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">
                    {row.parent_name || <span className="text-slate-400">(no name)</span>}
                    <span className="text-slate-400"> · {row.parent_email || row.parent_login_phone || "no email or phone"}</span>
                  </p>
                  {row.child_name && (
                    <p className="text-xs text-slate-500 truncate">
                      Child: {row.child_name}{row.child_class ? ` · ${row.child_class}` : ""}
                    </p>
                  )}
                  {result?.message && (
                    <p className={`text-xs mt-0.5 ${result.status === "error" ? "text-red-600 font-medium" : result.status === "skipped" ? "text-amber-600" : "text-green-600"}`}>
                      {result.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
