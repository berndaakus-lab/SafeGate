import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Users, UserCheck, ClipboardList, CheckCircle2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  const [
    { count: parentCount },
    { count: studentCount },
    { count: pickupCount },
    { data: recentLogs },
  ] = await Promise.all([
    supabaseAdmin.from("parents").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
    supabaseAdmin.from("students").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
    supabaseAdmin.from("pickup_logs").select("*, students!inner(*)", { count: "exact", head: true }).eq("students.school_id", schoolId),
    supabaseAdmin
      .from("pickup_logs")
      .select("*, students(name, school_id), authorized_persons(name)")
      .eq("students.school_id", schoolId)
      .order("picked_up_at", { ascending: false })
      .limit(8),
  ]);

  const stats = [
    { label: "Parents", value: parentCount ?? 0, icon: Users, href: "/admin/parents", color: "bg-blue-50 text-blue-600" },
    { label: "Students", value: studentCount ?? 0, icon: UserCheck, href: "/admin/parents", color: "bg-purple-50 text-purple-600" },
    { label: "Total Pickups", value: pickupCount ?? 0, icon: ClipboardList, href: "/admin/logs", color: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{(session?.user as any)?.schoolName}</h1>
        <p className="text-slate-500 mt-1">School admin dashboard.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent pickups */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <h2 className="font-semibold text-slate-900">Recent Pickups</h2>
          <Link href="/admin/logs" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>

        {!recentLogs?.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 text-sm">No pickups recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.students?.name}</p>
                    <p className="text-xs text-slate-400">
                      by <span className="font-medium text-slate-600">{log.authorized_persons?.name}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-700">{formatTime(log.picked_up_at)}</p>
                  <p className="text-xs text-slate-400">{formatDate(log.picked_up_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
