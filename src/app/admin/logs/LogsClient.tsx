"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, Loader2, Search, Calendar, X } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { PAGE_SIZES, type LogQuery, type LogRow } from "@/lib/pickup-logs-shared";
import { exportCsv, exportPdf } from "./export";

const EXPORT_CAP = 20000;

function ReleasedBy({ log }: { log: LogRow }) {
  if (!log.releasedBy) return <span className="text-slate-300">Not recorded</span>;
  return (
    <>
      {log.releasedBy}
      {log.releasedByRole && <span className="text-slate-400 capitalize"> ({log.releasedByRole})</span>}
    </>
  );
}

export default function LogsClient({
  rows,
  total,
  query,
  schoolName,
  error,
}: {
  rows: LogRow[];
  total: number;
  query: LogQuery;
  schoolName: string;
  error: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(query.q);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  const hasFilters = !!(query.q || query.from || query.to);
  const first = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const last = Math.min(total, query.page * query.pageSize);

  function go(changes: Record<string, string | number>, resetPage = true) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === "" || v === 0) next.delete(k);
      else next.set(k, String(v));
    }
    if (resetPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Search the database a moment after the user stops typing
  useEffect(() => {
    if (search.trim() === query.q) return;
    const t = setTimeout(() => go({ q: search.trim() }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  function clearFilters() {
    setSearch("");
    go({ q: "", from: "", to: "" });
  }

  async function fetchAll(): Promise<LogRow[] | null> {
    const all: LogRow[] = [];
    for (let page = 1; all.length < Math.min(total, EXPORT_CAP); page++) {
      const sp = new URLSearchParams({ page: String(page), size: "500" });
      if (query.q) sp.set("q", query.q);
      if (query.from) sp.set("from", query.from);
      if (query.to) sp.set("to", query.to);
      const res = await fetch(`/api/admin/logs?${sp}`);
      if (!res.ok) throw new Error("Could not load all the records.");
      const data = await res.json();
      if (!data.rows.length) break;
      all.push(...data.rows);
    }
    return all;
  }

  async function runExport(kind: "csv" | "pdf", scope: "page" | "all") {
    const key = `${kind}-${scope}`;
    setMenuOpen(false);
    setExportError("");
    setExporting(key);
    try {
      const data = scope === "page" ? rows : await fetchAll();
      if (!data?.length) {
        setExportError("There are no records to export.");
        return;
      }
      const filters = [
        query.q && `search "${query.q}"`,
        query.from && `from ${query.from}`,
        query.to && `to ${query.to}`,
      ].filter(Boolean).join(", ");
      if (kind === "csv") exportCsv(data);
      else await exportPdf(data, { schoolName, filters });
      if (scope === "all" && total > EXPORT_CAP) {
        setExportError(`Exported the latest ${EXPORT_CAP.toLocaleString()} of ${total.toLocaleString()} records. Narrow the dates to export the rest.`);
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed. Try again.");
    } finally {
      setExporting(null);
    }
  }

  const menu: { kind: "csv" | "pdf"; scope: "page" | "all"; label: string; hint: string }[] = [
    { kind: "csv", scope: "page", label: "This page as CSV", hint: `${rows.length} record${rows.length === 1 ? "" : "s"}` },
    { kind: "pdf", scope: "page", label: "This page as PDF", hint: `${rows.length} record${rows.length === 1 ? "" : "s"}` },
    { kind: "csv", scope: "all", label: "All matching as CSV", hint: `${total.toLocaleString()} record${total === 1 ? "" : "s"}` },
    { kind: "pdf", scope: "all", label: "All matching as PDF", hint: `${total.toLocaleString()} record${total === 1 ? "" : "s"}` },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pickup Logs</h1>
          <p className="text-slate-500 mt-1">Full audit trail of all pickups at your school.</p>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((o) => !o)} disabled={!!exporting || total === 0} aria-haspopup="menu" aria-expanded={menuOpen}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-800 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 disabled:opacity-60 w-full sm:w-auto justify-center">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Preparing..." : "Export"}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1">
              {menu.map((m, i) => (
                <button key={`${m.kind}-${m.scope}`} type="button" role="menuitem" onClick={() => runExport(m.kind, m.scope)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 ${i === 2 ? "border-t border-slate-100" : ""}`}>
                  <span className="block text-sm font-semibold text-slate-900">{m.label}</span>
                  <span className="block text-xs text-slate-500">{m.hint}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <p className="font-semibold">Couldn&apos;t load the pickup logs.</p>
          <p className="mt-1 break-words">{error}</p>
          <p className="mt-1 text-red-700">If this mentions pickup_log_details, a database migration hasn&apos;t been run yet.</p>
        </div>
      )}
      {exportError && <div role="alert" className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3">{exportError}</div>}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, class, collector, parent, staff..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input type="date" aria-label="From date" value={query.from} onChange={(e) => go({ from: e.target.value })}
            className="flex-1 min-w-0 sm:flex-none px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <span className="text-slate-500 text-sm shrink-0">to</span>
          <input type="date" aria-label="To date" value={query.to} onChange={(e) => go({ to: e.target.value })}
            className="flex-1 min-w-0 sm:flex-none px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500 shrink-0">
          {total === 0 ? "0 records" : `${first.toLocaleString()}-${last.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {!rows.length ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">
              {hasFilters ? "No pickups match your filters." : "No pickups recorded yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_auto] px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider gap-4">
              <span>Student</span>
              <span>Picked by</span>
              <span>Parent</span>
              <span>Released by</span>
              <span className="text-right">Time</span>
            </div>

            <div className="divide-y divide-slate-50">
              {rows.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{log.studentName}</p>
                      {log.className && <p className="text-xs text-slate-400">{log.className}</p>}
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">{log.collectedBy}</p>
                      <p className="text-xs text-slate-400">{[log.relation, log.vehicleNumber, log.method !== "Daily code" ? log.method : ""].filter(Boolean).join(" · ")}</p>
                    </div>
                    <p className="text-sm text-slate-500">{log.parentName}</p>
                    <p className="text-sm text-slate-700"><ReleasedBy log={log} /></p>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-slate-700">{formatTime(log.picked_up_at)}</p>
                      <p className="text-xs text-slate-400">{formatDate(log.picked_up_at)}</p>
                    </div>
                  </div>

                  <div className="md:hidden flex items-start justify-between gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{log.studentName}
                        {log.className && <span className="font-normal text-slate-400"> · {log.className}</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Picked by <strong>{log.collectedBy}</strong>{log.relation ? ` (${log.relation})` : ""}{log.vehicleNumber ? ` · ${log.vehicleNumber}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">Parent: {log.parentName}</p>
                      <p className="text-xs text-slate-400">Released by: <ReleasedBy log={log} /></p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-slate-700">{formatTime(log.picked_up_at)}</p>
                      <p className="text-xs text-slate-400">{formatDate(log.picked_up_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Paging */}
      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Rows per page
            <select value={query.pageSize} onChange={(e) => go({ size: Number(e.target.value) })}
              className="px-2 py-1.5 rounded-lg border border-slate-300 text-sm bg-white">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => go({ page: query.page - 1 }, false)} disabled={query.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-slate-600 px-1">Page {query.page} of {pages}</span>
            <button type="button" onClick={() => go({ page: query.page + 1 }, false)} disabled={query.page >= pages}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
