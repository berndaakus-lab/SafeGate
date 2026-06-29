import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CheckCircle2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export default async function LogsPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  const { data: logs } = await supabaseAdmin
    .from("pickup_logs")
    .select("*, students(name, class_name, school_id), authorized_persons(name, relation), parents(name)")
    .eq("students.school_id", schoolId)
    .order("picked_up_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pickup Logs</h1>
        <p className="text-slate-500 mt-1">Full audit trail of all pickups at your school.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {!logs?.length ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No pickups recorded yet.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Student</span>
              <span>Collected by</span>
              <span>Parent</span>
              <span className="text-right">Time</span>
            </div>
            <div className="divide-y divide-slate-50">
              {logs.map((log: any) => (
                <div key={log.id} className="grid grid-cols-4 px-6 py-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.students?.name}</p>
                    {log.students?.class_name && (
                      <p className="text-xs text-slate-400">{log.students.class_name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{log.authorized_persons?.name}</p>
                    {log.authorized_persons?.relation && (
                      <p className="text-xs text-slate-400">{log.authorized_persons.relation}</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{log.parents?.name}</p>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{formatTime(log.picked_up_at)}</p>
                    <p className="text-xs text-slate-400">{formatDate(log.picked_up_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
