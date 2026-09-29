import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import ImportClient from "./ImportClient";
import type { ImportKind } from "./importConfigs";

const TABS: { kind: ImportKind; label: string; href: string }[] = [
  { kind: "parents", label: "Parents & students", href: "/admin/import" },
  { kind: "staff", label: "Staff", href: "/admin/import?type=staff" },
];

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  const { type } = await searchParams;
  const kind: ImportKind = type === "staff" ? "staff" : "parents";

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Import</h1>

      <div role="tablist" aria-label="What to import" className="inline-flex rounded-xl bg-slate-100 p-1 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.kind}
            href={t.href}
            role="tab"
            aria-selected={kind === t.kind}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              kind === t.kind ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* key: switching tabs starts a fresh import instead of keeping the other type's rows */}
      <ImportClient key={kind} kind={kind} schoolId={schoolId} />
    </div>
  );
}
