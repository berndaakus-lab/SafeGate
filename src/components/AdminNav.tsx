"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutUser } from "@/lib/sign-out";
import { LayoutDashboard, Users, UserCheck, ClipboardList, LogOut, Settings, Upload, ScanLine, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import HomeLogoLink from "@/components/HomeLogoLink";
import SchoolLogo from "@/components/SchoolLogo";

// mobileHidden keeps the phone's bottom bar to six tabs; those pages are still reached from buttons on related pages
const links: { href: string; label: string; short?: string; icon: LucideIcon; mobileHidden?: boolean }[] = [
  { href: "/admin/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/admin/staff", label: "Staff", icon: UserCheck },
  { href: "/admin/parents", label: "Parents", icon: Users },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/import", label: "Import", icon: Upload, mobileHidden: true },
  { href: "/admin/logs", label: "Logs", icon: ClipboardList },
  { href: "/admin/account", label: "Account", icon: Settings },
];

export default function AdminNav({ schoolLogoUrl }: { schoolLogoUrl: string | null }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const schoolName: string = (session?.user as any)?.schoolName ?? "";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-slate-100 p-6 fixed left-0 top-0">
        <HomeLogoLink className="flex items-center gap-2 mb-5" />
        {schoolName && (
          <div className="flex items-center gap-2.5 mb-8 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <SchoolLogo name={schoolName} logoUrl={schoolLogoUrl} size="sm" />
            <p className="text-sm font-medium text-slate-700 truncate">{schoolName}</p>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname === href
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link
            href="/guard/scan"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-700 hover:bg-green-50 transition-all"
          >
            <ScanLine className="w-4 h-4" />
            Scan pickups
          </Link>
        </nav>

        <div className="border-t border-slate-100 pt-4 mt-4">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
              {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={() => signOutUser("/login")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-50">
        <HomeLogoLink size={28} textClassName="font-bold text-slate-900" />
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/guard/scan"
            className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-lg shrink-0"
          >
            <ScanLine className="w-3.5 h-3.5" /> Scan
          </Link>
          {schoolName && <SchoolLogo name={schoolName} logoUrl={schoolLogoUrl} size="sm" />}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex z-50 safe-area-pb">
        {links.filter((l) => !l.mobileHidden).map(({ href, label, short, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 basis-0 min-w-0 flex flex-col items-center gap-1 px-0.5 py-2.5 text-[11px] leading-tight font-medium transition-colors",
              pathname === href ? "text-blue-600" : "text-slate-400"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="max-w-full truncate">{short ?? label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => signOutUser("/login")}
          className="flex-1 basis-0 min-w-0 flex flex-col items-center gap-1 px-0.5 py-2.5 text-[11px] leading-tight font-medium text-slate-400 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="max-w-full truncate">Sign out</span>
        </button>
      </nav>
    </>
  );
}
