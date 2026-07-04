import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getSettings, s } from "@/lib/settings";
import { Shield, MessageCircle, WifiOff } from "lucide-react";
import { signOut } from "next-auth/react";
import OfflineSignOut from "./OfflineSignOut";

export const dynamic = "force-dynamic";

export default async function OfflinePage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  const [settings, { data: school }] = await Promise.all([
    getSettings(),
    schoolId
      ? supabaseAdmin.from("schools").select("name").eq("id", schoolId).single()
      : Promise.resolve({ data: null }),
  ]);

  const whatsapp = s(settings, "whatsapp", "233XXXXXXXXX");
  const waMsg = encodeURIComponent(
    `Hi VerifyGate, my school (${school?.name ?? "unknown"}) appears to be offline. Can you help get us back online?`
  );
  const waLink = `https://wa.me/${whatsapp}?text=${waMsg}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-slate-400" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">VerifyGate</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {school?.name ?? "Your school"} is currently offline
        </h1>
        <p className="text-slate-500 text-base leading-relaxed mb-8">
          Access to your VerifyGate account has been temporarily suspended.
          This may be due to a pending payment or account review.
          Please contact the VerifyGate team to restore access.
        </p>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-base w-full mb-4 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Contact VerifyGate on WhatsApp
        </a>

        <OfflineSignOut />
      </div>
    </div>
  );
}
