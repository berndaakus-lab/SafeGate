import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import QRScanner from "./QRScanner";
import HomeLogoLink from "@/components/HomeLogoLink";

export default async function GuardScanPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const dashboard = role === "admin" ? "/admin/dashboard" : role === "superadmin" ? "/superadmin/dashboard" : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <HomeLogoLink textClassName="font-bold text-white" />
        {dashboard ? (
          <Link href={dashboard} className="text-sm text-slate-300 hover:text-white">
            ← Back to dashboard
          </Link>
        ) : (
          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-medium">
            Scanner
          </span>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-2">Scan Pickup QR</h1>
          <p className="text-slate-400 text-center text-sm mb-8">
            Point the camera at the parent&apos;s QR code to verify and confirm pickup.
          </p>
          <QRScanner />
        </div>
      </main>
    </div>
  );
}
