import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { Users, UserCheck, QrCode, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { PageHeader, Section } from "@/components/ui";

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const [{ data: children }, { data: authorizedPeople }] = await Promise.all([
    supabaseAdmin.from("students").select("*").eq("parent_id", parentId).is("archived_at", null),
    supabaseAdmin.from("authorized_persons").select("*").eq("parent_id", parentId),
  ]);

  const studentIds = children?.map((c: any) => c.id) ?? [];

  const { data: recentPickups } = studentIds.length
    ? await supabaseAdmin
        .from("pickup_logs")
        .select("*, students(name), authorized_persons(name)")
        .in("student_id", studentIds)
        .order("picked_up_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const { count: totalPickups } = studentIds.length
    ? await supabaseAdmin
        .from("pickup_logs")
        .select("id", { count: "exact", head: true })
        .in("student_id", studentIds)
    : { count: 0 };

  const childCount = children?.length ?? 0;
  const personCount = authorizedPeople?.length ?? 0;
  const stats = [
    { label: "Children", value: childCount, icon: Users, href: "/parent/children", color: "bg-blue-50 text-blue-600" },
    { label: "Pickup persons", value: personCount, icon: UserCheck, href: "/parent/authorized", color: "bg-purple-50 text-purple-600" },
    { label: "Pickups", value: totalPickups ?? 0, icon: CheckCircle2, href: null, color: "bg-green-50 text-green-600" },
  ];
  const ready = childCount > 0 && personCount > 0;
  const usual = (authorizedPeople ?? []).find((p: any) => p.is_usual);
  const standingCount = (authorizedPeople ?? []).filter((p: any) => p.standing_token).length;

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title={`Welcome back, ${session?.user?.name?.split(" ")[0] ?? ""}`}
        subtitle="Your children's pickups at a glance."
      />

      {/* Main action first: it's what parents open the app for */}
      <div className="bg-blue-600 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-blue-600/20">
        <h2 className="font-semibold text-xl mb-1">Someone collecting today?</h2>
        <p className="text-blue-100 mb-5">Make a pickup QR code and send it to them. It works for one child or several.</p>
        {ready && usual && (
          <Link
            href="/parent/generate?quick=1"
            className="mb-3 inline-flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-green-600 transition-colors w-full sm:w-auto sm:mr-3"
          >
            <QrCode className="w-5 h-5" />
            Today: {usual.name.split(" ")[0]} collects {childCount === 1 ? "my child" : "all my children"}
          </Link>
        )}
        <Link
          href={ready ? "/parent/generate" : personCount === 0 ? "/parent/authorized" : "/parent/children"}
          className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-6 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors w-full sm:w-auto"
        >
          <QrCode className="w-5 h-5" />
          {ready ? "Generate QR Code" : personCount === 0 ? "First, add a pickup person" : "See my children"}
          <ArrowRight className="w-5 h-5" />
        </Link>
        {ready && !standingCount && (
          <p className="text-blue-100 text-sm mt-4">
            Same people collect every day?{" "}
            <Link href="/parent/authorized" className="underline font-semibold">Set up a regular pickup pass</Link> and you won&apos;t need a new code each day.
          </p>
        )}
        {!ready && (
          <p className="text-blue-100 text-sm mt-3">
            {childCount === 0
              ? "Your school hasn't added your children yet. They'll appear automatically."
              : "Add at least one trusted person (even yourself) before making a QR code."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map((s) => {
          const inner = (
            <>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-sm text-slate-600 mt-0.5">{s.label}</p>
            </>
          );
          const cls = "bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm";
          return s.href ? (
            <Link key={s.label} href={s.href} className={`${cls} hover:border-blue-300 transition-colors`}>{inner}</Link>
          ) : (
            <div key={s.label} className={cls}>{inner}</div>
          );
        })}
      </div>

      <Section icon={Clock} title="Recent pickups">
        {!recentPickups?.length ? (
          <div className="py-6 text-center">
            <p className="text-slate-700 font-medium">No pickups recorded yet</p>
            <p className="text-slate-500 text-sm mt-1">When your child is collected, it shows here and you get an alert.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 border-t border-slate-100">
            {recentPickups.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{log.students?.name}</p>
                    <p className="text-sm text-slate-600 truncate">
                      Picked up by <span className="font-medium text-slate-800">{log.authorized_persons?.name}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-800">{formatTime(log.picked_up_at)}</p>
                  <p className="text-xs text-slate-500">{formatDate(log.picked_up_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
