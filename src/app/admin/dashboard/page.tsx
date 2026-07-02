import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Users, UserCheck, ClipboardList, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  // Fetch student IDs first — Supabase ignores .eq("joined_table.col", val) silently
  const { data: studentRows } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("school_id", schoolId);
  const studentIds = studentRows?.map((s: any) => s.id) ?? [];

  const [
    { count: parentCount },
    { count: studentCount },
    { count: pickupCount },
    { data: recentLogs },
    { data: school },
  ] = await Promise.all([
    supabaseAdmin.from("parents").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
    supabaseAdmin.from("students").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
    studentIds.length > 0
      ? supabaseAdmin.from("pickup_logs").select("*", { count: "exact", head: true }).in("student_id", studentIds)
      : Promise.resolve({ count: 0 }),
    studentIds.length > 0
      ? supabaseAdmin
          .from("pickup_logs")
          .select("*, students(name), authorized_persons(name)")
          .in("student_id", studentIds)
          .order("picked_up_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    supabaseAdmin
      .from("schools")
      .select("plan, trial_ends_at, max_students")
      .eq("id", schoolId)
      .single(),
  ]);

  // Trial banner logic
  const plan = school?.plan ?? "trial";
  const trialEndsAt = school?.trial_ends_at ? new Date(school.trial_ends_at) : null;
  const maxStudents = school?.max_students ?? 100;
  const daysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const trialExpired = daysLeft !== null && daysLeft <= 0;
  const nearLimit = (studentCount ?? 0) >= maxStudents * 0.9;
  const atLimit = (studentCount ?? 0) >= maxStudents;
  const showBanner = plan === "trial" && (trialExpired || daysLeft !== null && daysLeft <= 14 || nearLimit);

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
          trialExpired || atLimit ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
        }`}>
          <div className="flex items-start gap-3">
            {trialExpired || atLimit
              ? <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              : <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            }
            <div>
              {trialExpired ? (
                <>
                  <p className="font-semibold text-red-800">Your free trial has ended</p>
                  <p className="text-sm text-red-600 mt-0.5">
                    Upgrade to keep VerifyGate running for your school.
                  </p>
                </>
              ) : atLimit ? (
                <>
                  <p className="font-semibold text-red-800">Student limit reached ({studentCount}/{maxStudents})</p>
                  <p className="text-sm text-red-600 mt-0.5">
                    You&apos;ve reached your trial limit. Upgrade for unlimited students.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-800">
                    {daysLeft !== null && daysLeft <= 14
                      ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left on your free trial`
                      : `${studentCount}/${maxStudents} students used`}
                  </p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {nearLimit && !atLimit
                      ? "Approaching student limit. Upgrade for unlimited students."
                      : `Trial ends ${trialEndsAt ? formatDate(trialEndsAt.toISOString()) : "soon"}.`}
                  </p>
                </>
              )}
            </div>
          </div>
          <Link
            href="/admin/subscribe"
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              trialExpired || atLimit
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            Upgrade to School Plan →
          </Link>
        </div>
      )}

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
