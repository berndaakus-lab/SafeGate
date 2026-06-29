import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ConfirmPickup from "./ConfirmPickup";
import { Shield, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const pickupCode = await prisma.pickupCode.findUnique({
    where: { code },
    include: {
      student: { include: { school: true } },
      authorizedPerson: true,
      parent: true,
      pickupLog: true,
    },
  });

  if (!pickupCode) return notFound();

  const isExpired = new Date() > new Date(pickupCode.expiresAt);
  const isUsed = !!pickupCode.pickupLog;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/guard/scan" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white">SafeGate</span>
        </Link>
        <Link href="/guard/scan" className="text-slate-400 text-sm hover:text-white">
          ← Scan again
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">

          {/* Already used */}
          {isUsed && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-6 text-center">
              <XCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-amber-300 mb-1">Already Used</h2>
              <p className="text-amber-400/70 text-sm">
                This code was already used at{" "}
                {pickupCode.pickupLog && formatTime(pickupCode.pickupLog.pickedUpAt)}.
              </p>
            </div>
          )}

          {/* Expired */}
          {!isUsed && isExpired && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6 text-center">
              <Clock className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-red-300 mb-1">Code Expired</h2>
              <p className="text-red-400/70 text-sm">This pickup code has expired. Ask the parent to generate a new one.</p>
            </div>
          )}

          {/* Valid */}
          {!isUsed && !isExpired && (
            <div>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Code Valid</span>
              </div>

              {/* School */}
              <p className="text-center text-slate-400 text-xs mb-6 uppercase tracking-widest">
                {pickupCode.student.school.name}
              </p>

              {/* Child card */}
              <div className="bg-slate-800 rounded-2xl p-5 mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Child</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center text-2xl font-bold text-blue-400">
                    {pickupCode.student.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{pickupCode.student.name}</p>
                    {pickupCode.student.className && (
                      <p className="text-slate-400 text-sm">{pickupCode.student.className}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Authorized person card */}
              <div className="bg-slate-800 rounded-2xl p-5 mb-6">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Authorized to Collect</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center text-2xl font-bold text-purple-400">
                    {pickupCode.authorizedPerson.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{pickupCode.authorizedPerson.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      {pickupCode.authorizedPerson.relation && (
                        <p className="text-slate-400 text-sm">{pickupCode.authorizedPerson.relation}</p>
                      )}
                      {pickupCode.authorizedPerson.phone && (
                        <p className="text-slate-400 text-sm">{pickupCode.authorizedPerson.phone}</p>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      Parent: {pickupCode.parent.name}
                    </p>
                  </div>
                </div>
              </div>

              <ConfirmPickup pickupCodeId={pickupCode.id} studentId={pickupCode.studentId} authorizedPersonId={pickupCode.authorizedPersonId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
