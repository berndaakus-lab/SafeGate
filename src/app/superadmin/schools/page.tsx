import { supabaseAdmin } from "@/lib/supabase";
import CreateSchoolForm from "./CreateSchoolForm";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLAN_BADGE: Record<string, string> = {
  trial: "bg-amber-100 text-amber-700",
  school: "bg-green-100 text-green-700",
  enterprise: "bg-purple-100 text-purple-700",
};

export default async function SchoolsPage() {
  const { data: schools } = await supabaseAdmin
    .from("schools")
    .select("id, name, address, phone, created_at, plan, trial_ends_at, max_students")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
        <p className="text-slate-500 mt-1">Create and manage schools on SafeGate.</p>
      </div>

      {/* Existing schools */}
      {schools && schools.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">Active Schools ({schools.length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {schools.map((school: any) => (
              <div key={school.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700">
                    {school.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{school.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_BADGE[school.plan ?? "trial"] ?? PLAN_BADGE.trial}`}>
                        {school.plan ?? "trial"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {school.address && `${school.address} · `}Added {formatDate(school.created_at)}
                      {school.trial_ends_at && school.plan === "trial" && (
                        <> · Trial ends {formatDate(school.trial_ends_at)}</>
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/superadmin/schools/${school.id}`}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Manage →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create new school */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Add New School</h2>
        <p className="text-sm text-slate-400 mb-6">
          This will create the school and the first admin account for that school.
        </p>
        <CreateSchoolForm />
      </div>
    </div>
  );
}
