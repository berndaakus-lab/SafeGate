import { supabaseAdmin } from "@/lib/supabase";
import {
  School, Users, UserCheck, TrendingUp, Bell, MessageSquare,
  AlertCircle, Zap, Radio, Activity, BarChart2, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/utils";
import BroadcastPanel from "./BroadcastPanel";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const [
    { count: schoolCount },
    { count: parentCount },
    { count: studentCount },
    { count: pickupCount },
    { count: leadsTotal },
    { count: leadsNew },
    { count: leadsOnboarded },
    { data: schools },
    { data: recentLeads },
    { data: notifLogs },
  ] = await Promise.all([
    supabaseAdmin.from("schools").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("parents").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("students").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("pickup_logs").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("demo_requests").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("demo_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabaseAdmin.from("demo_requests").select("*", { count: "exact", head: true }).eq("status", "onboarded"),
    supabaseAdmin.from("schools").select("id, name, plan, is_active, created_at").order("created_at", { ascending: false }),
    supabaseAdmin.from("demo_requests").select("id, name, school_name, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabaseAdmin.from("notification_logs").select("outcome, created_at").order("created_at", { ascending: false }).limit(200),
  ]);

  const conversionRate = leadsTotal ? Math.round(((leadsOnboarded ?? 0) / leadsTotal) * 100) : 0;

  // Notification stats
  const pushOk = notifLogs?.filter((l: any) => l.outcome === "push_ok").length ?? 0;
  const smsFallback = notifLogs?.filter((l: any) => l.outcome?.includes("sms_ok")).length ?? 0;
  const failed = notifLogs?.filter((l: any) => l.outcome?.includes("fail")).length ?? 0;
  const totalNotifs = notifLogs?.length ?? 0;
  const pushRate = totalNotifs ? Math.round((pushOk / totalNotifs) * 100) : 0;

  const activeSchools = schools?.filter((s: any) => s.is_active !== false).length ?? 0;
  const offlineSchools = schools?.filter((s: any) => s.is_active === false).length ?? 0;

  return (
    <div className="p-6 max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Super Admin</h1>
        <p className="text-slate-500 mt-1">Platform overview — all schools on VerifyGate.</p>
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Schools", value: schoolCount ?? 0, icon: School, color: "bg-blue-50 text-blue-600" },
          { label: "Total Parents", value: parentCount ?? 0, icon: Users, color: "bg-purple-50 text-purple-600" },
          { label: "Total Students", value: studentCount ?? 0, icon: UserCheck, color: "bg-green-50 text-green-600" },
          { label: "Total Pickups", value: pickupCount ?? 0, icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lead overview + School health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">Lead Overview</h2>
            </div>
            <Link href="/superadmin/demo-requests" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Total Leads", value: leadsTotal ?? 0, cls: "bg-slate-50 text-slate-900" },
              { label: "New / Pending", value: leadsNew ?? 0, cls: "bg-blue-50 text-blue-700" },
              { label: "Onboarded", value: leadsOnboarded ?? 0, cls: "bg-green-50 text-green-700" },
              { label: "Conversion Rate", value: `${conversionRate}%`, cls: "bg-amber-50 text-amber-700" },
            ].map((w) => (
              <div key={w.label} className={`${w.cls} rounded-xl p-3`}>
                <p className="text-xl font-black">{w.value}</p>
                <p className="text-xs mt-0.5 opacity-70">{w.label}</p>
              </div>
            ))}
          </div>
          {(leadsNew ?? 0) > 0 ? (
            <Link
              href="/superadmin/demo-requests"
              className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors w-full justify-center"
            >
              <Bell className="w-4 h-4" />
              {leadsNew} new lead{leadsNew !== 1 ? "s" : ""} waiting
            </Link>
          ) : (
            <p className="text-xs text-slate-400 text-center">No new leads right now.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-slate-900">School Health</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 text-green-700 rounded-xl p-4">
              <p className="text-2xl font-black">{activeSchools}</p>
              <p className="text-xs mt-0.5 opacity-70">Live Schools</p>
            </div>
            <div className={`${offlineSchools > 0 ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-400"} rounded-xl p-4`}>
              <p className="text-2xl font-black">{offlineSchools}</p>
              <p className="text-xs mt-0.5 opacity-70">Offline Schools</p>
            </div>
          </div>
          <div className="space-y-2">
            {schools?.slice(0, 4).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.is_active === false ? "bg-red-400" : "bg-green-400"}`} />
                  <p className="text-sm text-slate-700">{s.name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  s.plan === "trial" ? "bg-amber-100 text-amber-700" :
                  s.plan === "growth" ? "bg-blue-100 text-blue-700" :
                  s.plan === "premier" ? "bg-purple-100 text-purple-700" :
                  s.plan === "international" ? "bg-slate-800 text-white" :
                  "bg-green-100 text-green-700"
                }`}>{s.plan ?? "trial"}</span>
              </div>
            ))}
          </div>
          <Link href="/superadmin/schools" className="text-xs text-blue-600 hover:underline mt-3 block text-center">
            Manage all schools →
          </Link>
        </div>
      </div>

      {/* Notification monitoring */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Notification Monitoring</h2>
          <span className="text-xs text-slate-400 ml-auto">Last 200 deliveries</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Push Success Rate", value: `${pushRate}%`, icon: Zap, cls: "bg-indigo-50 text-indigo-700" },
            { label: "Push Delivered", value: pushOk, icon: CheckCircle2, cls: "bg-green-50 text-green-700" },
            { label: "SMS Fallbacks", value: smsFallback, icon: MessageSquare, cls: "bg-amber-50 text-amber-700" },
            { label: "Failed Deliveries", value: failed, icon: AlertCircle, cls: failed > 0 ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-400" },
          ].map((w) => (
            <div key={w.label} className={`${w.cls} rounded-xl p-4`}>
              <w.icon className="w-4 h-4 mb-2 opacity-70" />
              <p className="text-xl font-black">{w.value}</p>
              <p className="text-xs mt-0.5 opacity-70">{w.label}</p>
            </div>
          ))}
        </div>
        {notifLogs && notifLogs.length > 0 && (
          <div className="border-t border-slate-50 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recent events</p>
            <div className="space-y-1.5">
              {notifLogs.slice(0, 6).map((log: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      log.outcome === "push_ok" ? "bg-green-500" :
                      log.outcome?.includes("sms_ok") ? "bg-amber-500" :
                      "bg-red-400"
                    }`} />
                    <span className="text-slate-600 font-mono">{log.outcome}</span>
                  </div>
                  <span className="text-slate-400">{formatTime(log.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity feed + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900">Recent Lead Requests</h2>
            </div>
            <Link href="/superadmin/demo-requests" className="text-xs text-blue-600 hover:underline">All leads →</Link>
          </div>
          {!recentLeads?.length ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No leads yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-400">{lead.school_name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      lead.status === "new" ? "bg-blue-100 text-blue-700" :
                      lead.status === "contacted" ? "bg-amber-100 text-amber-700" :
                      lead.status === "onboarded" ? "bg-green-100 text-green-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>{lead.status}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(lead.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-slate-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/superadmin/schools"
              className="flex items-center gap-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              <School className="w-4 h-4" /> Add New School
            </Link>
            <Link
              href="/superadmin/demo-requests"
              className="flex items-center gap-3 w-full bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              Review Leads
              {(leadsNew ?? 0) > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{leadsNew}</span>
              )}
            </Link>
            <Link
              href="/superadmin/settings"
              className="flex items-center gap-3 w-full border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              <Activity className="w-4 h-4" /> Platform Settings
            </Link>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Broadcast Push Notification</p>
            <BroadcastPanel schools={schools ?? []} />
          </div>
        </div>
      </div>

      {/* All schools table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <h2 className="font-semibold text-slate-900">All Schools</h2>
          <Link href="/superadmin/schools" className="text-sm text-blue-600 font-medium hover:underline">
            + Add School
          </Link>
        </div>
        {!schools?.length ? (
          <div className="px-6 py-12 text-center">
            <School className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No schools yet.</p>
            <Link href="/superadmin/schools" className="text-blue-600 text-sm mt-1 inline-block hover:underline">
              Add your first school →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {schools.map((school: any) => (
              <div key={school.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700 text-sm">
                      {school.name[0].toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${school.is_active === false ? "bg-red-400" : "bg-green-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{school.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${
                      school.plan === "trial" ? "bg-amber-100 text-amber-700" :
                      school.plan === "growth" ? "bg-blue-100 text-blue-700" :
                      school.plan === "premier" ? "bg-purple-100 text-purple-700" :
                      school.plan === "international" ? "bg-slate-700 text-white" :
                      "bg-green-100 text-green-700"
                    }`}>{school.plan ?? "trial"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Added {formatDate(school.created_at)}</p>
                  <Link href={`/superadmin/schools/${school.id}`} className="text-xs text-blue-600 hover:underline">
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
