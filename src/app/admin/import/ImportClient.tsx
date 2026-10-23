"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Loader2, FileText, RotateCcw, Info, Check, KeyRound } from "lucide-react";
import { parseCsvRecords } from "@/lib/csv";
import { downloadCsv } from "@/lib/csv-download";
import { IMPORT_CONFIGS, type ImportKind, type RowValues } from "./importConfigs";

type Row = { line: number; values: RowValues };

function StepHeader({ n, title, hint, done = false }: { n: number; title: string; hint?: string; done?: boolean }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}>
        {done ? <Check className="w-4 h-4" /> : n}
      </span>
      <div className="min-w-0 pt-0.5">
        <h2 className="font-semibold text-slate-900 text-base leading-snug">{title}</h2>
        {hint && <p className="text-sm text-slate-500 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

/** Turns the config's "when needed" text into an easy-to-scan badge. */
function NeedBadge({ when }: { when: string }) {
  const style =
    when === "Optional" ? "bg-slate-100 text-slate-600"
    : when.toLowerCase().includes("email or") ? "bg-blue-100 text-blue-800"
    : "bg-amber-100 text-amber-800";
  return <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${style}`}>{when}</span>;
}
type Status = "pending" | "ok" | "skipped" | "error";
type Result = { status: Status; message: string };

export default function ImportClient({ schoolId, kind }: { schoolId: string; kind: ImportKind }) {
  const config = IMPORT_CONFIGS[kind];
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
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState(false);
  // Passwords the system made. Held only in this page's memory: the server keeps just a scrambled copy.
  const [generated, setGenerated] = useState<string[][]>([]);
  const [savedList, setSavedList] = useState(false);

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([config.template], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = config.templateFile;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setRows([]); setResults([]); setFileName(""); setFileError("");
    setDone(false); setOnlyProblems(false); setProgress(0); setCounts({});
    setGenerated([]); setSavedList(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) loadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (importing) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setFileError("That isn't a CSV file. In Excel use File, Save As, CSV UTF-8, then try again.");
      return;
    }
    loadFile(file);
  }

  function loadFile(file: File) {
    reset();
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsvRecords(String(reader.result ?? ""), config.aliases).map((values, i) => ({
        line: i + 2,
        values: config.prepare ? config.prepare(values) : values,
      }));
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

  async function importRow(row: Row): Promise<Result & { tally: string[]; credentialRow?: string[] }> {
    const problem = config.precheck?.(row.values);
    if (problem) return { status: "error", message: problem, tally: [] };
    try {
      const res = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config.toBody(row.values, schoolId)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fields: Record<string, string> = data.fields ?? {};
        const message = Object.keys(fields).length
          ? [...new Set(Object.entries(fields).map(([k, v]) => `${config.fieldToColumn[k] ?? k}: ${v}`))].join(" ")
          : data.error || "Failed";
        return { status: "error", message, tally: [] };
      }
      const outcome = config.interpret(data);
      const credentialRow = outcome.credential && config.credentialRow ? config.credentialRow(row.values, outcome.credential) : undefined;
      return { ...outcome, credentialRow };
    } catch {
      return { status: "error", message: "Network error. Check your connection and import again.", tally: [] };
    }
  }

  async function runImport() {
    setImporting(true);
    const updated = [...results];
    const tally: Record<string, number> = { skipped: 0, errors: 0 };
    const made: string[][] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = await importRow(rows[i]);
      updated[i] = { status: r.status, message: r.message };
      r.tally.forEach((k) => { tally[k] = (tally[k] ?? 0) + 1; });
      if (r.credentialRow) made.push(r.credentialRow);
      if (r.status === "skipped") tally.skipped++;
      if (r.status === "error") tally.errors++;
      setResults([...updated]);
      setProgress(i + 1);
    }

    setCounts(tally);
    setGenerated(made);
    setImporting(false);
    setDone(true);
    if (tally.errors) setOnlyProblems(true);
    router.refresh();
  }

  const errors = counts.errors ?? 0;
  const visible = rows
    .map((row, i) => ({ row, result: results[i] }))
    .filter(({ result }) => !onlyProblems || result?.status === "error");
  const summaryTiles = [
    ...config.summary.map((s) => ({ label: s.label, value: counts[s.key] ?? 0, tone: "text-green-700" })),
    { label: "Already existed", value: counts.skipped ?? 0, tone: "text-amber-600" },
    { label: "Rows with problems", value: errors, tone: errors ? "text-red-600" : "text-slate-400" },
  ];

  return (
    <div>
      <p className="text-slate-600 mb-6">{config.intro}</p>

      {/* Step 1 */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <StepHeader n={1} title="Download the template" hint="Fill it in, or export these columns from your school management system." />
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-600/20 w-full sm:w-auto"
          >
            <Download className="w-4 h-4" /> Download template
          </button>
        </div>

        {/* Phones: one small card per column, no sideways scrolling */}
        <ul className="sm:hidden divide-y divide-slate-100 rounded-xl border border-slate-200">
          {config.columns.map((c) => (
            <li key={c.name} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-medium text-slate-800 break-all">{c.name}</span>
                <NeedBadge when={c.when} />
              </div>
              <p className="text-sm text-slate-600 mt-1">{c.note}</p>
            </li>
          ))}
        </ul>

        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Column</th>
                <th className="text-left font-semibold px-4 py-3">Needed?</th>
                <th className="text-left font-semibold px-4 py-3">What to put</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {config.columns.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-3 font-mono text-sm font-medium text-slate-800 whitespace-nowrap">{c.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><NeedBadge when={c.when} /></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
          <ul className="space-y-1 text-sm text-blue-900">
            {config.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      </section>

      {/* Step 2 */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-4">
        <div className="mb-4">
          <StepHeader n={2} title="Upload your CSV file" hint="In Excel: File, Save As, then choose CSV UTF-8." />
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!importing) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={importing}
          className={`w-full flex flex-col items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-10 transition-colors disabled:opacity-50 ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : fileName
                ? "border-green-300 bg-green-50/50 hover:border-green-400"
                : "border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <span className={`w-14 h-14 rounded-full flex items-center justify-center ${fileName ? "bg-green-100" : "bg-blue-100"}`}>
            {fileName ? <FileText className="w-7 h-7 text-green-600" /> : <Upload className="w-7 h-7 text-blue-600" />}
          </span>
          {fileName ? (
            <>
              <span className="text-base font-semibold text-slate-900 break-all">{fileName}</span>
              <span className="text-sm text-slate-600">{rows.length} row{rows.length !== 1 ? "s" : ""} ready to check below</span>
              <span className="text-sm font-medium text-blue-700 underline underline-offset-2">Choose a different file</span>
            </>
          ) : (
            <>
              <span className="text-base font-semibold text-slate-900">{dragging ? "Drop the file here" : "Drag your CSV file here"}</span>
              <span className="text-sm text-slate-500">or</span>
              <span className="inline-flex items-center gap-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm">
                <Upload className="w-4 h-4" /> Choose file
              </span>
            </>
          )}
        </button>
        {fileError && <p role="alert" className="text-sm font-medium text-red-600 mt-3">{fileError}</p>}
      </section>

      {/* Step 3 */}
      {rows.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <StepHeader
              n={3}
              title={
                importing
                  ? `Importing ${progress} of ${rows.length}...`
                  : done
                    ? "Import finished"
                    : `Review and import ${rows.length} row${rows.length !== 1 ? "s" : ""}`
              }
              done={done}
            />
            <div className="flex items-center gap-3">
              {done && errors > 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
                  Show only rows with problems
                </label>
              )}
              {done ? (
                <button onClick={() => {
                  if (generated.length && !savedList && !window.confirm("The passwords made for this import will be lost. Download the list first. Leave without it?")) return;
                  reset();
                }} className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50">
                  <RotateCcw className="w-4 h-4" /> Import another file
                </button>
              ) : (
                <button
                  onClick={runImport}
                  disabled={importing}
                  className="inline-flex items-center justify-center gap-2 bg-green-600 text-white text-base font-semibold px-6 py-3 rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm shadow-green-600/20 disabled:opacity-60 w-full sm:w-auto"
                >
                  {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  {importing ? "Importing..." : `Import ${rows.length} row${rows.length !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>

          {done && (
            <div className={`px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-3 text-center ${summaryTiles.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
              {summaryTiles.map((s) => (
                <div key={s.label}>
                  <p className={`text-xl font-bold tabular-nums ${s.tone}`}>{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          {done && generated.length > 0 && (
            <div className="px-6 py-5 bg-amber-50 border-b border-amber-200">
              <p className="flex items-center gap-2 font-semibold text-amber-900">
                <KeyRound className="w-4 h-4" /> {generated.length} password{generated.length === 1 ? " was" : "s were"} made for you
              </p>
              <p className="text-sm text-amber-900/90 mt-1">
                Download the list now. It can&apos;t be shown again, because only a scrambled copy is kept. Give each person <strong>only their own</strong> password, privately.
                Do not post the list or one password in a WhatsApp group. Everyone must choose their own password when they first sign in.
              </p>
              <button type="button"
                onClick={() => { downloadCsv(`temporary-passwords-${new Date().toISOString().slice(0, 10)}.csv`, [config.credentialHead ?? [], ...generated]); setSavedList(true); }}
                className="mt-3 inline-flex items-center gap-2 bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-700">
                <Download className="w-4 h-4" /> Download the password list (CSV)
              </button>
              {savedList && <p className="text-xs text-amber-900/80 mt-2">Downloaded. Keep the file somewhere private and delete it once the passwords are shared.</p>}
            </div>
          )}
          {done && errors > 0 && (
            <p className="px-6 py-3 text-xs text-slate-500 border-b border-slate-50">
              Fix the rows below in your spreadsheet and upload the whole file again. Rows that already went in will be skipped.
            </p>
          )}

          <div className="divide-y divide-slate-50 max-h-[32rem] overflow-y-auto">
            {visible.map(({ row, result }) => {
              const { title, detail, sub } = config.rowTitle(row.values);
              return (
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
                      {title || <span className="text-slate-400">(no name)</span>}
                      <span className="text-slate-400"> · {detail}</span>
                    </p>
                    {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
                    {result?.message && (
                      <p className={`text-xs mt-0.5 ${result.status === "error" ? "text-red-600 font-medium" : result.status === "skipped" ? "text-amber-600" : "text-green-600"}`}>
                        {result.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
