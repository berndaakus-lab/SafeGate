import { supabaseAdmin } from "@/lib/supabase";
import { School, Users, UserCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function SuperAdminDashboard() {
  const [
    { count: schoolCount },
    { count: parentCount },
    { count: studentCount },
    { count: pickupCount },
    { data: schools },
  ] = await Promise.all([
    supabaseAdmin.from("schools").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("parents").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("students").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("pickup_logs").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("schools").select("id, name, phone, created_at").order("created_at", { ascending: false }),
  ]);

  const stats = [
    { label: "Total Schools", value: schoolCount ?? 0, icon: School, color: "bg-blue-50 text-blue-600" },
    { label: "Total Parents", value: parentCount ?? 0, icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Total Students", value: studentCount ?? 0, icon: UserCheck, color: "bg-green-50 text-green-600" },
    { label: "Total Pickups", value: pickupCount ?? 0, icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Super Admin</h1>
        <p className="text-slate-500 mt-1">Overview of all schools on SafeGate.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Schools list */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <h2 className="font-semibold text-slate-900">All Schools</h2>
          <Link
            href="/superadmin/schools"
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            + Add School
          </Link>
        </div>

        {!schools?.length ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <School className="w-6 h-6 text-slate-400" />
            </div>
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
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700 text-sm">
                    {school.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{school.name}</p>
                    {school.phone && (
                      <p className="text-xs text-slate-400">{school.phone}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Added {formatDate(school.created_at)}</p>
                  <Link
                    href={`/superadmin/schools/${school.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
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
