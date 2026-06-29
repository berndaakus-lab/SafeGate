import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, UserCheck, QrCode, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const [children, authorizedPeople, recentPickups] = await Promise.all([
    prisma.student.findMany({ where: { parentId } }),
    prisma.authorizedPerson.findMany({ where: { parentId } }),
    prisma.pickupLog.findMany({
      where: { student: { parentId } },
      include: { student: true, authorizedPerson: true },
      orderBy: { pickedUpAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Children", value: children.length, icon: Users, href: "/parent/children", color: "bg-blue-50 text-blue-600" },
    { label: "Pickup Persons", value: authorizedPeople.length, icon: UserCheck, href: "/parent/authorized", color: "bg-purple-50 text-purple-600" },
    { label: "Total Pickups", value: recentPickups.length, icon: CheckCircle2, href: "#", color: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s an overview of your children&apos;s pickup status.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-blue-600 rounded-2xl p-6 mb-8 text-white">
        <h2 className="font-semibold text-lg mb-1">Generate a Pickup Code</h2>
        <p className="text-blue-100 text-sm mb-4">
          Someone picking up your child today? Generate a QR code and send it to them.
        </p>
        <Link
          href="/parent/generate"
          className="inline-flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          Generate QR Code
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recent pickups */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Pickups
          </h2>
        </div>
        {recentPickups.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No pickups recorded yet.</p>
            <p className="text-slate-400 text-xs mt-1">Pickup activity will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentPickups.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.student.name}</p>
                    <p className="text-xs text-slate-400">
                      Picked up by <span className="font-medium text-slate-600">{log.authorizedPerson.name}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-700">{formatTime(log.pickedUpAt)}</p>
                  <p className="text-xs text-slate-400">{formatDate(log.pickedUpAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
