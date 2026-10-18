import { getServerSession } from "next-auth";
import Link from "next/link";
import { CheckCircle2, GraduationCap, UserCheck, Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import ImportClient from "./ImportClient";
import type { ImportKind } from "./importConfigs";

const TABS: { kind: ImportKind; label: string; desc: string; href: string; icon: typeof Users }[] = [
  { kind: "parents", label: "Parents & students", desc: "Parents with their children", href: "/admin/import", icon: Users },
  { kind: "students", label: "Students", desc: "Your school's student list", href: "/admin/import?type=students", icon: GraduationCap },
  { kind: "staff", label: "Staff", desc: "Guards and on-duty teachers", href: "/admin/import?type=staff", icon: UserCheck },
];

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  const { type } = await searchParams;
  const kind: ImportKind = type === "staff" ? "staff" : type === "students" ? "students" : "parents";

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Import</h1>
      <p className="text-slate-500 mt-1 mb-5">Choose what you want to add from a spreadsheet.</p>

      <div role="tablist" aria-label="What to import" className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {TABS.map((t) => {
          const active = kind === t.kind;
          const Icon = t.icon;
          return (
            <Link
              key={t.kind}
              href={t.href}
              role="tab"
              aria-selected={active}
              className={`relative flex items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-white/15" : "bg-blue-50 text-blue-600"}`}>
                <Icon className="w-6 h-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-base">{t.label}</span>
                <span className={`block text-sm ${active ? "text-blue-100" : "text-slate-500"}`}>{t.desc}</span>
              </span>
              {active && <CheckCircle2 className="w-5 h-5 ml-auto shrink-0 text-white" />}
            </Link>
          );
        })}
      </div>

      {/* key: switching tabs starts a fresh import instead of keeping the other type's rows */}
      <ImportClient key={kind} kind={kind} schoolId={schoolId} />
    </div>
  );
}
