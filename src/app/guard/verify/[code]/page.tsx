import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ConfirmPickup from "./ConfirmPickup";
import { Clock, XCircle, ShieldAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatTime } from "@/lib/utils";
import SchoolLogo from "@/components/SchoolLogo";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const guardSchoolId = (session?.user as any)?.schoolId as string | null;

  if (!session || !["guard", "teacher"].includes(role) || !guardSchoolId) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-6 text-center">
        <ShieldAlert className="w-14 h-14 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-red-300 mb-2">Guard or teacher sign-in required</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xs">
          Sign in with your guard or teacher account to view and confirm this pickup.
        </p>
        <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  const { data: pickupCode } = await supabaseAdmin
    .from("pickup_codes")
    .select(`
      *,
      students(id, name, class_name, photo_url, school_id, schools(name, logo_url)),
      authorized_persons(name, phone, relation),
      parents(name),
      pickup_logs(id, picked_up_at)
    `)
    .eq("code", code)
    .single();

  // Code not found at all
  if (!pickupCode) {
    return <WrongCode message="Invalid code. This QR code does not exist." />;
  }

  const studentSchoolId = pickupCode.students?.school_id;

  // Guard trying to verify a code from a different school
  if (guardSchoolId && studentSchoolId && guardSchoolId !== studentSchoolId) {
    return (
      <WrongSchool
        guardSchool={(session?.user as any)?.schoolName ?? "your school"}
        codeSchool={pickupCode.students?.schools?.name ?? "another school"}
      />
    );
  }

  const isExpired = new Date() > new Date(pickupCode.expires_at);
  const isUsed = pickupCode.pickup_logs && pickupCode.pickup_logs.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/guard/scan" className="flex items-center gap-2">
          <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white">VerifyGate</span>
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

              <div className="flex flex-col items-center gap-2 mb-6">
                {pickupCode.students?.schools?.logo_url && (
                  <SchoolLogo name={pickupCode.students.schools.name} logoUrl={pickupCode.students.schools.logo_url} size="lg" />
                )}
                <p className="text-center text-slate-400 text-xs uppercase tracking-widest">
                  {pickupCode.students?.schools?.name}
                </p>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Child</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-blue-600/20 flex items-center justify-center text-2xl font-bold text-blue-400">
                    {pickupCode.students?.photo_url ? (
                      <Image
                        src={pickupCode.students.photo_url}
                        alt={pickupCode.students.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      pickupCode.students?.name?.[0]?.toUpperCase()
                    )}
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

function WrongSchool({ guardSchool, codeSchool }: { guardSchool: string; codeSchool: string }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/guard/scan" className="flex items-center gap-2">
          <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white">VerifyGate</span>
        </Link>
        <Link href="/guard/scan" className="text-slate-400 text-sm hover:text-white">← Scan again</Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-8">
            <ShieldAlert className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-300 mb-2">Wrong School</h2>
            <p className="text-red-400/80 text-sm leading-relaxed mb-4">
              This QR code belongs to <span className="font-bold text-red-300">{codeSchool}</span>.
              You are scanning for <span className="font-bold text-white">{guardSchool}</span>.
            </p>
            <p className="text-slate-500 text-xs">
              This child does not belong to your school. Do not authorise this pickup.
            </p>
          </div>
          <Link
            href="/guard/scan"
            className="mt-6 inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            ← Scan again
          </Link>
        </div>
      </main>
    </div>
  );
}

function WrongCode({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/guard/scan" className="flex items-center gap-2">
          <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white">VerifyGate</span>
        </Link>
        <Link href="/guard/scan" className="text-slate-400 text-sm hover:text-white">← Scan again</Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-8">
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-300 mb-2">Invalid Code</h2>
            <p className="text-red-400/80 text-sm">{message}</p>
          </div>
          <Link
            href="/guard/scan"
            className="mt-6 inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            ← Scan again
          </Link>
        </div>
      </main>
    </div>
  );
}
