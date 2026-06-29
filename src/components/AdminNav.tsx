"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Shield, LayoutDashboard, Users, UserCheck, ClipboardList, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/staff", label: "Staff", icon: UserCheck },
  { href: "/admin/parents", label: "Parents", icon: Users },
  { href: "/admin/logs", label: "Pickup Logs", icon: ClipboardList },
  { href: "/admin/account", label: "Account", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-slate-100 p-6 fixed left-0 top-0">
      <Link href="/" className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-slate-900">SafeGate</span>
      </Link>
      <p className="text-xs text-slate-400 mb-10 pl-10">{(session?.user as any)?.schoolName}</p>

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
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
