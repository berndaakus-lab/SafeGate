"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Search, Calendar, X } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

type Log = {
  id: string;
  picked_up_at: string;
  studentName: string;
  className: string;
  collectedBy: string;
  relation: string;
  parentName: string;
};

export default function LogsClient({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const match =
          log.studentName.toLowerCase().includes(q) ||
          log.collectedBy.toLowerCase().includes(q) ||
          log.parentName.toLowerCase().includes(q) ||
          log.className.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Date from
      if (dateFrom) {
        if (new Date(log.picked_up_at) < new Date(dateFrom)) return false;
      }

      // Date to, include full end day
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(log.picked_up_at) > end) return false;
      }

      return true;
    });
  }, [logs, search, dateFrom, dateTo]);

  const hasFilters = search || dateFrom || dateTo;

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pickup Logs</h1>
        <p className="text-slate-500 mt-1">Full audit trail of all pickups at your school.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, collector, parent..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date from */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400 shrink-0">
          {filtered.length} of {logs.length} record{logs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {!filtered.length ? (
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
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto] px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider gap-4">
              <span>Student</span>
              <span>Picked by</span>
              <span>Parent</span>
              <span className="text-right">Time</span>
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{log.studentName}</p>
                      {log.className && <p className="text-xs text-slate-400">{log.className}</p>}
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">{log.collectedBy}</p>
                      {log.relation && <p className="text-xs text-slate-400">{log.relation}</p>}
                    </div>
                    <p className="text-sm text-slate-500">{log.parentName}</p>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-slate-700">{formatTime(log.picked_up_at)}</p>
                      <p className="text-xs text-slate-400">{formatDate(log.picked_up_at)}</p>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden flex items-start justify-between gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{log.studentName}
                        {log.className && <span className="font-normal text-slate-400"> · {log.className}</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Picked by <strong>{log.collectedBy}</strong>{log.relation ? ` (${log.relation})` : ""}</p>
                      <p className="text-xs text-slate-400">Parent: {log.parentName}</p>
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
    </div>
  );
}
