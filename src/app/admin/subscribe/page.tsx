import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { getSettings, s } from "@/lib/settings";
import SubscribeForm from "./SubscribeForm";
import { Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SubscribePage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) redirect("/login");

  const [{ data: school }, settings] = await Promise.all([
    supabaseAdmin.from("schools").select("name, plan, trial_ends_at, max_students").eq("id", schoolId).single(),
    getSettings(),
  ]);

  if (school?.plan === "school" || school?.plan === "enterprise") {
    redirect("/admin/dashboard");
  }

  const price = s(settings, "plan_school_price", "GHS 150");
  const priceNum = parseFloat(price.replace(/[^\d.]/g, "")) || 150;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">SafeGate</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Upgrade to School Plan</h1>
          <p className="text-slate-500">
            {school?.name} · Keep SafeGate running beyond your free trial.
          </p>
        </div>

        {/* Plan card */}
        <div className="bg-blue-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-end gap-1 mb-4">
            <span className="text-4xl font-black">{price}</span>
            <span className="text-blue-200 text-sm mb-1">/ {s(settings, "plan_school_note", "per month")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              "Unlimited students",
              "Unlimited QR scans",
              "SMS notifications",
              "Multiple admin accounts",
              "Guard & teacher roles",
              "Bulk student import",
              "Student photo ID",
              "Priority support",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0" />
                <span className="text-blue-50 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Pay via Mobile Money</h2>
          <p className="text-sm text-slate-400 mb-5">
            Enter your MoMo number. You&apos;ll receive a payment prompt on your phone.
          </p>
          <SubscribeForm amountGhs={priceNum} reference={school?.plan ?? ""} />
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Need help?{" "}
          {s(settings, "whatsapp") && (
            <a href={`https://wa.me/${s(settings, "whatsapp")}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              WhatsApp us
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
