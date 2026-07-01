"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Shield, LayoutDashboard, School, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/schools", label: "Schools", icon: School },
  { href: "/superadmin/settings", label: "Settings", icon: Settings },
];

export default function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-slate-900 p-6 fixed left-0 top-0">
      <Link href="/" className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-white">SafeGate</span>
      </Link>
      <p className="text-xs text-slate-500 mb-10 pl-10">Super Admin</p>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              pathname === href
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-800 pt-4 mt-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
