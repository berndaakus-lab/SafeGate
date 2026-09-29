import { supabaseAdmin } from "@/lib/supabase";
import CreateSchoolForm from "./CreateSchoolForm";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import SchoolLogo from "@/components/SchoolLogo";
import { TIERS, subscriptionState, tierOf } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  const { data: schools } = await supabaseAdmin
    .from("schools")
    .select("id, name, address, phone, logo_url, created_at, plan, trial_ends_at, paid_until, max_students")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
        <p className="text-slate-500 mt-1">Create and manage schools on VerifyGate.</p>
      </div>

      {/* Existing schools */}
      {schools && schools.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">Active Schools ({schools.length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {schools.map((school: any) => {
              const sub = subscriptionState(school);
              const badge =
                sub.kind === "paid" ? { text: "Paid", cls: "bg-green-100 text-green-700" }
                : sub.kind === "trial" ? { text: "Trial", cls: "bg-amber-100 text-amber-700" }
                : sub.kind === "expired" ? { text: "Ended", cls: "bg-red-100 text-red-700" }
                : { text: "No dates", cls: "bg-slate-100 text-slate-600" };
              const when =
                sub.kind === "paid" ? `Paid until ${formatDate(sub.endsAt.toISOString())}`
                : sub.kind === "trial" ? `Trial ends ${formatDate(sub.endsAt.toISOString())}`
                : sub.kind === "expired" ? `Ended ${formatDate(sub.endedAt.toISOString())}`
                : null;
              return (
              <div key={school.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <SchoolLogo name={school.name} logoUrl={school.logo_url} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900">{school.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>
                      <span className="text-xs text-slate-400">{TIERS[tierOf(school.plan)].label}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {school.address && `${school.address} · `}Added {formatDate(school.created_at)}
                      {when && <> · {when}</>}
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
              );
            })}
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
