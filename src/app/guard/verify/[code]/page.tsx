import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ConfirmPickup from "./ConfirmPickup";
import { Shield, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const { data: pickupCode } = await supabaseAdmin
    .from("pickup_codes")
    .select(`
      *,
      students(name, class_name, schools(name)),
      authorized_persons(name, phone, relation),
      parents(name),
      pickup_logs(id, picked_up_at)
    `)
    .eq("code", code)
    .single();

  if (!pickupCode) return notFound();

  const isExpired = new Date() > new Date(pickupCode.expires_at);
  const isUsed = pickupCode.pickup_logs && pickupCode.pickup_logs.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/guard/scan" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white">SafeGate</span>
        </Link>
        <Link href="/guard/scan" className="text-slate-400 text-sm hover:text-white">← Scan again</Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">

          {isUsed && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-6 text-center">
              <XCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-amber-300 mb-1">Already Used</h2>
              <p className="text-amber-400/70 text-sm">
                Used at {formatTime(pickupCode.pickup_logs[0].picked_up_at)}.
              </p>
            </div>
          )}

          {!isUsed && isExpired && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6 text-center">
              <Clock className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-red-300 mb-1">Code Expired</h2>
              <p className="text-red-400/70 text-sm">Ask the parent to generate a new code.</p>
            </div>
          )}

          {!isUsed && !isExpired && (
            <div>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Code Valid</span>
              </div>

              <p className="text-center text-slate-400 text-xs mb-6 uppercase tracking-widest">
                {pickupCode.students?.schools?.name}
              </p>

              <div className="bg-slate-800 rounded-2xl p-5 mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Child</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center text-2xl font-bold text-blue-400">
                    {pickupCode.students?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{pickupCode.students?.name}</p>
                    {pickupCode.students?.class_name && (
                      <p className="text-slate-400 text-sm">{pickupCode.students.class_name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 mb-6">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Authorized to Collect</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center text-2xl font-bold text-purple-400">
                    {pickupCode.authorized_persons?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{pickupCode.authorized_persons?.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      {pickupCode.authorized_persons?.relation && (
                        <p className="text-slate-400 text-sm">{pickupCode.authorized_persons.relation}</p>
                      )}
                      {pickupCode.authorized_persons?.phone && (
                        <p className="text-slate-400 text-sm">{pickupCode.authorized_persons.phone}</p>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-1">Parent: {pickupCode.parents?.name}</p>
                  </div>
                </div>
              </div>

              <ConfirmPickup
                pickupCodeId={pickupCode.id}
                studentId={pickupCode.student_id}
                authorizedPersonId={pickupCode.authorized_person_id}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
