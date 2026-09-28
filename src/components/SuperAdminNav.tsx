"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutUser } from "@/lib/sign-out";
import { LayoutDashboard, School, LogOut, Settings, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import HomeLogoLink from "@/components/HomeLogoLink";

const links = [
  { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/schools", label: "Schools", icon: School },
  { href: "/superadmin/demo-requests", label: "Leads", icon: Inbox },
  { href: "/superadmin/settings", label: "Settings", icon: Settings },
];

export default function SuperAdminNav({ newLeads = 0 }: { newLeads?: number }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-slate-900 p-6 fixed left-0 top-0">
        <HomeLogoLink className="flex items-center gap-2 mb-2" textClassName="font-bold text-lg text-white" />
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
              {label === "Leads" && newLeads > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {newLeads}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-4">
          <button
            onClick={() => signOutUser("/login")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 sticky top-0 z-50">
        <HomeLogoLink size={28} textClassName="font-bold text-white" />
        <span className="text-xs text-slate-400 font-medium">Super Admin</span>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex z-50">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative",
              pathname === href ? "text-blue-400" : "text-slate-500"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
            {label === "Leads" && newLeads > 0 && (
              <span className="absolute top-2 right-1/4 bg-blue-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {newLeads > 9 ? "9+" : newLeads}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
