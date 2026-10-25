import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Car, Clock, ShieldCheck } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { APPROVAL_TOKEN } from "@/lib/pickup-pass";
import ApproveButtons from "./ApproveButtons";

export const metadata: Metadata = { title: "Approve pickup", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function pick<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

function Shell({ school, children }: { school?: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-blue-700" /></div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">VerifyGate</p>
            {school && <p className="text-sm text-slate-600 leading-tight">{school}</p>}
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

// The page a parent opens from the message when someone arrives without a pass.
// It shows only what's needed to answer: who is collecting which child.
export default async function ApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!APPROVAL_TOKEN.test(token)) notFound();

  const { data } = await supabaseAdmin
    .from("pickup_approvals")
    .select("status, expires_at, students(name, class_name, photo_url), authorized_persons(name, relation, photo_url, vehicle_number), schools(name)")
    .eq("token", token)
    .maybeSingle();
  if (!data) notFound();

  const student = pick<any>(data.students);
  const person = pick<any>(data.authorized_persons);
  const school = pick<any>(data.schools);
  const expired = data.status === "pending" && new Date(data.expires_at) < new Date();

  if (data.status !== "pending" || expired) {
    const text =
      data.status === "approved" ? "You approved this pickup. The guard can now see it." :
      data.status === "declined" ? "You declined this pickup. The child will not be released." :
      "This request has expired. If someone is still waiting, the guard will ask again.";
    return (
      <Shell school={school?.name}>
        <h1 className="text-xl font-bold text-slate-900 mb-2">{data.status === "approved" ? "Approved" : data.status === "declined" ? "Declined" : "Request expired"}</h1>
        <p className="text-slate-600">{text}</p>
      </Shell>
    );
  }

  return (
    <Shell school={school?.name}>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Is this person collecting {student?.name}?</h1>
      <p className="text-slate-600 text-sm mb-5">Someone is at the gate without a pass. Only approve if you know them.</p>

      <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 mb-3">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-700 shrink-0">
          {person?.photo_url ? <Image src={person.photo_url} alt={person.name} width={80} height={80} className="w-full h-full object-cover" /> : person?.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900 break-words">{person?.name}</p>
          {person?.relation && <p className="text-sm text-slate-600">{person.relation}</p>}
          {person?.vehicle_number && (
            <p className="inline-flex items-center gap-1 mt-1 text-sm font-bold text-amber-800 bg-amber-100 rounded-md px-2 py-0.5"><Car className="w-3.5 h-3.5" /> {person.vehicle_number}</p>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600 mb-1">To collect: <strong className="text-slate-900">{student?.name}</strong>{student?.class_name ? `, ${student.class_name}` : ""}</p>
      <p className="text-xs text-slate-500 flex items-center gap-1 mb-6"><Clock className="w-3.5 h-3.5" /> This request expires in a few minutes.</p>

      <ApproveButtons token={token} personName={person?.name ?? "this person"} />
    </Shell>
  );
}
