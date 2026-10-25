import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import QRScanner from "./QRScanner";
import HomeLogoLink from "@/components/HomeLogoLink";
import SignOutButton from "./SignOutButton";

export default async function GuardScanPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const dashboard = role === "admin" ? "/admin/dashboard" : role === "superadmin" ? "/superadmin/dashboard" : null;

  return (
    <div className="flex-1 bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <HomeLogoLink textClassName="font-bold text-white" />
        <div className="flex items-center gap-3">
          {dashboard && (
            <Link href={dashboard} className="text-sm text-slate-300 hover:text-white">
              ← Dashboard
            </Link>
          )}
          <SignOutButton compact={!!dashboard} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-2">Scan Pickup QR</h1>
          <p className="text-slate-400 text-center text-sm mb-8">
            Point the camera at the parent&apos;s QR code to verify and confirm pickup.
          </p>
          <QRScanner />
          <Link
            href="/guard/lookup"
            className="mt-4 block text-center text-sm font-semibold text-blue-300 hover:text-white bg-slate-800/50 rounded-2xl px-5 py-4"
          >
            No pass or code? Find the child by name
          </Link>
        </div>
      </main>
    </div>
  );
}
