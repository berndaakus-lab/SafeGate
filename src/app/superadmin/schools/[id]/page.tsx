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
import EditSchoolInfoForm from "./EditSchoolInfoForm";
import StaffList from "./StaffList";
import ParentsList from "./ParentsList";
import DeleteSchoolButton from "./DeleteSchoolButton";
import SchoolLogo from "@/components/SchoolLogo";
import SchoolLogoEditor from "./SchoolLogoEditor";
import AddStaffPanel from "./AddStaffPanel";
import { TIERS, monthlyPriceGhs, type Tier } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function ManageSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch student IDs first, Supabase ignores .eq("joined_table.col", val) silently
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
    { data: payments },
  ] = await Promise.all([
    supabaseAdmin.from("schools").select("*").eq("id", id).single(),
    supabaseAdmin.from("staff").select("id, name, email, login_phone, role").eq("school_id", id).order("role"),
    supabaseAdmin.from("parents").select("id, name, email, login_phone, phone").eq("school_id", id).order("name"),
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
    supabaseAdmin
      .from("payments")
      .select("reference, months, amount_pesewas, status, failure_reason, created_at, paid_at")
      .eq("school_id", id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const studentCount = studentIds.length;

  if (!school) return notFound();

  const tierDefaults = Object.fromEntries(
    (Object.keys(TIERS) as Tier[]).map((t) => [t, monthlyPriceGhs({ plan: t, custom_price: null }, settings)])
  ) as Record<Tier, number | null>;
  const adminsWithPhone = (staff ?? []).filter((s: any) => s.role === "admin" && s.login_phone).length;

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/superadmin/schools" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Schools
        </Link>
        <div className="flex items-center gap-4">
          <SchoolLogo name={school.name} logoUrl={school.logo_url} size="lg" />
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
          <StaffList staff={staff ?? []} />
          <AddStaffPanel schoolId={id} />
        </div>

        {/* Parents */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">Parents</h2>
          </div>
          <ParentsList parents={parents ?? []} />
        </div>
      </div>

      {/* School info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">School Info</h2>
        <p className="text-sm text-slate-400 mb-5">Edit this school&apos;s logo, name, address, and phone number.</p>
        <div className="mb-6">
          <SchoolLogoEditor schoolId={id} schoolName={school.name} logoUrl={school.logo_url ?? null} />
        </div>
        <EditSchoolInfoForm
          schoolId={id}
          name={school.name}
          address={school.address ?? null}
          phone={school.phone ?? null}
        />
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
                    <p className="text-xs text-slate-400">
                      by {log.authorized_persons?.name}
                      {log.confirmed_by_name && ` · released by ${log.confirmed_by_name}${log.confirmed_by_role ? ` (${log.confirmed_by_role})` : ""}`}
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

      {/* Plan management */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Subscription Plan</h2>
        <p className="text-sm text-slate-400 mb-5">
          Set the tier, price and dates. School admins get SMS reminders 14, 7 and 3 days before their trial or paid period ends.
        </p>
        {adminsWithPhone === 0 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 mb-5">
            No admin at this school has a login phone, so reminder SMS can&apos;t reach them. Add a phone to an admin in Staff Accounts.
          </p>
        )}
        <PlanManager
          schoolId={id}
          currentPlan={school.plan ?? "trial"}
          trialEndsAt={school.trial_ends_at ?? null}
          paidUntil={school.paid_until ?? null}
          maxStudents={school.max_students ?? 100}
          customPrice={school.custom_price ?? null}
          tierDefaults={tierDefaults}
        />

        {payments && payments.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-medium text-slate-600 mb-3">Recent MoMo payments</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="text-xs text-slate-400 text-left">
                  <tr>
                    <th className="font-medium pb-2">Date</th>
                    <th className="font-medium pb-2">Period</th>
                    <th className="font-medium pb-2">Amount</th>
                    <th className="font-medium pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map((p: any) => (
                    <tr key={p.reference}>
                      <td className="py-2 text-slate-600">{formatDate(p.paid_at ?? p.created_at)}</td>
                      <td className="py-2 text-slate-600">{p.months} month{p.months === 1 ? "" : "s"}</td>
                      <td className="py-2 text-slate-900 tabular-nums">GHS {(p.amount_pesewas / 100).toLocaleString()}</td>
                      <td className="py-2">
                        <span
                          title={p.failure_reason ?? undefined}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.status === "success" ? "bg-green-50 text-green-700"
                            : p.status === "failed" ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.status === "success" ? "Paid" : p.status === "failed" ? "Failed" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 mt-6">
        <h2 className="font-semibold text-red-700 mb-1">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-5">
          Permanently delete this school. Only possible once all staff, parents, and students have been removed.
        </p>
        <DeleteSchoolButton schoolId={id} schoolName={school.name} />
      </div>
    </div>
  );
}
