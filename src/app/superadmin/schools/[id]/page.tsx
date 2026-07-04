import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, UserCheck, ClipboardList, School, CheckCircle2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { getSettings, s } from "@/lib/settings";
import ResetPasswordForm from "./ResetPasswordForm";
import PlanManager from "./PlanManager";
import GoLiveToggle from "./GoLiveToggle";
import PaymentLinkPanel from "./PaymentLinkPanel";

export const dynamic = "force-dynamic";

export default async function ManageSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch student IDs first — Supabase ignores .eq("joined_table.col", val) silently
  const { data: studentRows } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("school_id", id);
  const studentIds = studentRows?.map((s: any) => s.id) ?? [];

  const [
    { data: school },
    { data: staff },
    { data: parents },
    { data: recentLogs },
    { count: pickupCount },
    settings,
  ] = await Promise.all([
    supabaseAdmin.from("schools").select("*").eq("id", id).single(),
    supabaseAdmin.from("staff").select("id, name, email, role").eq("school_id", id).order("role"),
    supabaseAdmin.from("parents").select("id, name, email, phone").eq("school_id", id).order("name"),
    studentIds.length > 0
      ? supabaseAdmin
          .from("pickup_logs")
          .select("*, students(name), authorized_persons(name)")
          .in("student_id", studentIds)
          .order("picked_up_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? supabaseAdmin
          .from("pickup_logs")
          .select("*", { count: "exact", head: true })
          .in("student_id", studentIds)
      : Promise.resolve({ count: 0 }),
    getSettings(),
  ]);

  const studentCount = studentIds.length;

  if (!school) return notFound();

  const roleColors: Record<string, string> = {
    admin: "bg-blue-100 text-blue-700",
    guard: "bg-green-100 text-green-700",
    teacher: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/superadmin/schools" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Schools
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center font-bold text-blue-700 text-lg">
            {school.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
            <p className="text-slate-400 text-sm">
              {school.address && `${school.address} · `}
              Added {formatDate(school.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Staff", value: staff?.length ?? 0, icon: UserCheck, color: "bg-blue-50 text-blue-600" },
          { label: "Parents", value: parents?.length ?? 0, icon: Users, color: "bg-purple-50 text-purple-600" },
          { label: "Students", value: studentCount ?? 0, icon: School, color: "bg-amber-50 text-amber-600" },
          { label: "Total Pickups", value: pickupCount ?? 0, icon: ClipboardList, color: "bg-green-50 text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Staff */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">Staff Accounts</h2>
          </div>
          {!staff?.length ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No staff accounts yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {staff.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColors[s.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {s.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parents */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">Parents</h2>
          </div>
          {!parents?.length ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No parents registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {parents.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent pickups */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-50">
          <h2 className="font-semibold text-slate-900">Recent Pickups</h2>
        </div>
        {!recentLogs?.length ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">No pickups recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.students?.name}</p>
                    <p className="text-xs text-slate-400">by {log.authorized_persons?.name}</p>
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

      {/* Plan management */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Subscription Plan</h2>
        <p className="text-sm text-slate-400 mb-5">
          Activate or change the plan for this school. Trial schools see a countdown banner on their dashboard.
        </p>
        <PlanManager
          schoolId={id}
          currentPlan={school.plan ?? "trial"}
          trialEndsAt={school.trial_ends_at ?? null}
          maxStudents={school.max_students ?? 100}
          customPrice={school.custom_price ?? null}
        />
      </div>

      {/* Go-live toggle */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">School Access</h2>
        <p className="text-sm text-slate-400 mb-5">
          Toggle the school live or offline. When offline, all staff, guards and parents see a suspension notice instead of the app.
        </p>
        <GoLiveToggle schoolId={id} isActive={school.is_active !== false} />
      </div>

      {/* Payment link */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Send Payment Link</h2>
        <p className="text-sm text-slate-400 mb-5">
          Share this link with the school admin via WhatsApp. They open it, enter their MoMo number, and pay. Their account activates automatically once payment is confirmed.
        </p>
        <PaymentLinkPanel
          schoolId={id}
          schoolName={school.name}
          whatsapp={s(settings, "whatsapp", "233XXXXXXXXX")}
        />
      </div>

      {/* Reset staff password */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Reset Staff Password</h2>
        <p className="text-sm text-slate-400 mb-5">
          Reset a password for any staff member at this school.
        </p>
        <ResetPasswordForm staff={staff ?? []} />
      </div>
    </div>
  );
}
