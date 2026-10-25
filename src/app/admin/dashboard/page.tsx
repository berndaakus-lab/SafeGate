import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Users, UserCheck, ClipboardList, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { subscriptionState } from "@/lib/subscription";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  // Pickups come from the school-filtered view, so the query stays small however many students there are
  const [
    { count: parentCount },
    { count: studentCount },
    { count: pickupCount },
    { data: recentRows },
    { data: school },
  ] = await Promise.all([
    supabaseAdmin.from("parents").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
    supabaseAdmin.from("students").select("*", { count: "exact", head: true }).eq("school_id", schoolId).is("archived_at", null),
    supabaseAdmin.from("pickup_log_details").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
    supabaseAdmin
      .from("pickup_log_details")
      .select("id, picked_up_at, student_name, collected_by")
      .eq("school_id", schoolId)
      .order("picked_up_at", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("schools")
      .select("plan, trial_ends_at, paid_until, max_students")
      .eq("id", schoolId)
      .single(),
  ]);
  const recentLogs = (recentRows ?? []).map((l: any) => ({
    id: l.id,
    picked_up_at: l.picked_up_at,
    students: { name: l.student_name },
    authorized_persons: { name: l.collected_by },
  }));

  // Subscription banner: trial or paid period ending soon, or ended
  const sub = school ? subscriptionState(school) : { kind: "none" as const };
  const maxStudents = school?.max_students ?? 100;
  const nearLimit = sub.kind === "trial" && (studentCount ?? 0) >= maxStudents * 0.9;
  const atLimit = sub.kind === "trial" && (studentCount ?? 0) >= maxStudents;
  const ended = sub.kind === "expired";
  const endingSoon = (sub.kind === "trial" || sub.kind === "paid") && sub.daysLeft <= 14;
  const showBanner = ended || endingSoon || nearLimit;
  const urgent = ended || atLimit;
  const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

  let bannerTitle = "";
  let bannerText = "";
  let bannerCta = "Pay now";
  if (sub.kind === "expired") {
    bannerTitle = sub.wasPaid ? "Your subscription has ended" : "Your free trial has ended";
    bannerText = `It ended on ${formatDate(sub.endedAt.toISOString())}. Pay now to keep VerifyGate running for your school.`;
  } else if (sub.kind === "paid" && endingSoon) {
    bannerTitle = `Subscription ends in ${days(sub.daysLeft)}`;
    bannerText = `Paid until ${formatDate(sub.endsAt.toISOString())}. Renew to avoid interruption.`;
    bannerCta = "Renew now";
  } else if (atLimit) {
    bannerTitle = `Student limit reached (${studentCount}/${maxStudents})`;
    bannerText = "You've reached your trial limit. Choose a plan for more students.";
  } else if (sub.kind === "trial" && endingSoon) {
    bannerTitle = `${days(sub.daysLeft)} left on your free trial`;
    bannerText = `Trial ends ${formatDate(sub.endsAt.toISOString())}.${nearLimit ? ` ${studentCount}/${maxStudents} students used.` : ""}`;
  } else if (nearLimit) {
    bannerTitle = `${studentCount}/${maxStudents} students used`;
    bannerText = "Approaching your trial student limit.";
  }

  const stats = [
    { label: "Parents", value: parentCount ?? 0, icon: Users, href: "/admin/parents", color: "bg-blue-50 text-blue-600" },
    { label: "Students", value: studentCount ?? 0, icon: UserCheck, href: "/admin/parents", color: "bg-purple-50 text-purple-600" },
    { label: "Total Pickups", value: pickupCount ?? 0, icon: ClipboardList, href: "/admin/logs", color: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="p-6 max-w-4xl">
      {/* Trial banner */}
      {showBanner && (
        <div className={`rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          urgent ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
        }`}>
          <div className="flex items-start gap-3">
            {urgent
              ? <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              : <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            }
            <div>
              <p className={`font-semibold ${urgent ? "text-red-800" : "text-amber-800"}`}>{bannerTitle}</p>
              <p className={`text-sm mt-0.5 ${urgent ? "text-red-600" : "text-amber-700"}`}>{bannerText}</p>
            </div>
          </div>
          <Link
            href="/admin/subscribe"
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              urgent ? "bg-red-600 text-white hover:bg-red-700" : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            {bannerCta} →
          </Link>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{(session?.user as any)?.schoolName}</h1>
        <p className="text-slate-500 mt-1">School admin dashboard.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-tight">{s.label}</p>
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
