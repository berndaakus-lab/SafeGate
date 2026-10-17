"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { btnSmall, inputBase } from "@/components/ui";

type Item = {
  id: string;
  search: string; // lower-cased parent and child names, contact details
  header: ReactNode;
  action: ReactNode;
  body: ReactNode;
};

export default function ParentsList({ items }: { items: Item[] }) {
  // Short lists start open; long ones start folded so the page stays tidy
  const [open, setOpen] = useState<Set<string>>(() => new Set(items.length <= 2 ? items.map((i) => i.id) : []));
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => i.search.includes(q)) : items;
  const allOpen = shown.length > 0 && shown.every((i) => open.has(i.id));

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function setAll(value: boolean) {
    setOpen((prev) => {
      const next = new Set(prev);
      for (const i of shown) value ? next.add(i.id) : next.delete(i.id);
      return next;
    });
  }

  return (
    <div className="mb-8">
      {items.length > 2 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="search" aria-label="Search parents and children" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by parent or child name" className={`${inputBase} !pl-10`} />
          </div>
          <button type="button" onClick={() => setAll(!allOpen)} className={`${btnSmall} !py-3 shrink-0`}>
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-slate-500 px-1">No parent or child matches &quot;{query}&quot;.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((item) => {
            const isOpen = open.has(item.id);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-start gap-2 pr-3 sm:pr-4">
                  <button type="button" onClick={() => toggle(item.id)} aria-expanded={isOpen} aria-controls={`parent-${item.id}`}
                    className="flex-1 min-w-0 flex items-start gap-4 text-left px-5 sm:px-6 py-4 hover:bg-slate-50/70">
                    {item.header}
                  </button>
                  <div className="py-4 shrink-0">{item.action}</div>
                  <button type="button" onClick={() => toggle(item.id)} aria-label={isOpen ? "Collapse" : "Expand"} tabIndex={-1}
                    className="py-4 pl-1 text-slate-400 hover:text-slate-700 shrink-0">
                    <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {isOpen && <div id={`parent-${item.id}`}>{item.body}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
