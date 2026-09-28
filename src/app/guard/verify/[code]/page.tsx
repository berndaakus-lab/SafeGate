import { getServerSession } from "next-auth";
import { loadPickupCode } from "@/lib/pickup-codes";
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

  const loaded = await loadPickupCode({ code });

  if (!loaded || loaded.children.length === 0) {
    return <WrongCode message="Invalid code. This QR code does not exist." />;
  }
  const { pickupCode, children, school } = loaded;

  // Staff trying to verify a code from a different school
  if (children.some((c) => c.school_id !== guardSchoolId)) {
    return (
      <WrongSchool
        guardSchool={(session?.user as any)?.schoolName ?? "your school"}
        codeSchool={school?.name ?? "another school"}
      />
    );
  }

  const isExpired = new Date() > new Date(pickupCode.expiresAt);
  const isUsed = children.every((c) => c.pickedUpAt);
  const person = pickupCode.authorizedPerson;

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
              <h2 className="text-xl font-bold text-amber-300 mb-3">Already Used</h2>
              <ul className="space-y-1 text-amber-400/80 text-sm">
                {children.map((c) => (
                  <li key={c.id}>
                    {c.name} picked up at {formatTime(c.pickedUpAt!)}
                    {c.releasedBy ? ` by ${c.releasedBy}` : ""}
                  </li>
                ))}
              </ul>
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
                {school?.logo_url && <SchoolLogo name={school.name} logoUrl={school.logo_url} size="lg" />}
                <p className="text-center text-slate-400 text-xs uppercase tracking-widest">{school?.name}</p>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Authorized to Collect</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center text-2xl font-bold text-purple-400 shrink-0">
                    {person?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-white">{person?.name}</p>
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      {person?.relation && <p className="text-slate-400 text-sm">{person.relation}</p>}
                      {person?.phone && <p className="text-slate-400 text-sm">{person.phone}</p>}
                    </div>
                    <p className="text-slate-500 text-xs mt-1">Parent: {pickupCode.parent?.name}</p>
                  </div>
                </div>
              </div>

              <ConfirmPickup pickupCodeId={pickupCode.id} childList={children} />
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
