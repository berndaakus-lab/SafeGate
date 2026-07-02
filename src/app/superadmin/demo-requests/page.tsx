import { supabaseAdmin } from "@/lib/supabase";
import { formatDate, formatTime } from "@/lib/utils";
import DemoRequestActions from "./DemoRequestActions";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter (Free)",
  school: "School Plan",
  enterprise: "Enterprise",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  onboarded: "bg-green-100 text-green-700",
  declined: "bg-slate-100 text-slate-500",
};

export default async function DemoRequestsPage() {
  const { data: requests } = await supabaseAdmin
    .from("demo_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const newCount = requests?.filter((r: any) => r.status === "new").length ?? 0;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demo Requests</h1>
          <p className="text-slate-500 mt-1">Schools that filled the contact form.</p>
        </div>
        {newCount > 0 && (
          <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            {newCount} new
          </span>
        )}
      </div>

      {!requests?.length ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400">No demo requests yet. They&apos;ll appear here when schools fill the contact form.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {requests.map((r: any) => (
              <div key={r.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-900">{r.school_name}</p>
                      {r.plan && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                          {PLAN_LABELS[r.plan] ?? r.plan}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{r.contact_name}</p>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <a href={`mailto:${r.email}`} className="text-sm text-blue-600 hover:underline">{r.email}</a>
                      {r.phone && <a href={`tel:${r.phone}`} className="text-sm text-slate-500">{r.phone}</a>}
                    </div>
                    {r.message && (
                      <p className="text-sm text-slate-400 mt-2 italic">&ldquo;{r.message}&rdquo;</p>
                    )}
                    <p className="text-xs text-slate-300 mt-2">{formatDate(r.created_at)} at {formatTime(r.created_at)}</p>
                  </div>
                  <DemoRequestActions id={r.id} currentStatus={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
