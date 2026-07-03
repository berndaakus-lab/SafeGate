import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { getSettings, s } from "@/lib/settings";
import SubscribeForm from "./SubscribeForm";
import { Shield, CheckCircle2, MessageCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAID_PLANS = ["standard", "growth", "premier", "international", "school", "enterprise"];

const TIER_KEYS: Record<string, { monthly: string; annual: string; label: string; sub: string }> = {
  standard:      { monthly: "tier_standard_monthly",     annual: "tier_standard_annual",     label: "Standard",     sub: "Up to 100 students" },
  growth:        { monthly: "tier_growth_monthly",       annual: "tier_growth_annual",       label: "Growth",       sub: "101 – 500 students" },
  premier:       { monthly: "tier_premier_monthly",      annual: "tier_premier_annual",      label: "Premier",      sub: "500+ students" },
  international: { monthly: "tier_international_monthly", annual: "tier_international_annual", label: "International", sub: "Any size · premium" },
};

const FEATURES = [
  "Unlimited QR code scans",
  "SMS notifications to parents",
  "Guard scanner — no app needed",
  "Multiple admin accounts",
  "Guard & teacher roles",
  "Student photo ID",
  "Bulk parent & student import",
  "Full pickup audit trail",
  "Priority support",
];

export default async function SubscribePage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) redirect("/login");

  const [{ data: school }, settings] = await Promise.all([
    supabaseAdmin.from("schools").select("name, plan, trial_ends_at, max_students").eq("id", schoolId).single(),
    getSettings(),
  ]);

  // Already on a paid plan — nothing to do
  if (school?.plan && PAID_PLANS.includes(school.plan)) {
    redirect("/admin/dashboard");
  }

  const currentPlan = school?.plan ?? "trial";
  const tier = TIER_KEYS[currentPlan] ?? TIER_KEYS.growth;

  const whatsapp = s(settings, "whatsapp", "");
  const waMsg = encodeURIComponent(
    `Hi VerifyGate! I'd like to upgrade my school (${school?.name ?? ""}) and need help with the payment. Can you assist?`
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">VerifyGate</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Activate your subscription</h1>
          <p className="text-slate-500 text-sm">
            {school?.name} · Pay via Mobile Money to keep your school running.
          </p>
        </div>

        {/* Plan summary */}
        <div className="bg-blue-600 rounded-2xl p-6 mb-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Your plan</p>
              <p className="text-white font-black text-2xl">{tier.label}</p>
              <p className="text-blue-200 text-sm">{tier.sub}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs mb-1">Price</p>
              <p className="text-white font-black text-xl">
                {s(settings, tier.monthly, "Contact us")}
              </p>
              <p className="text-blue-200 text-xs">/month</p>
            </div>
          </div>

          {/* Annual option callout */}
          {s(settings, tier.annual, "") && (
            <div className="bg-blue-500/40 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
              <p className="text-blue-100 text-xs">Annual billing (2 months free)</p>
              <p className="text-white font-bold text-sm">{s(settings, tier.annual, "")}/yr</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <span className="text-blue-50 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MoMo payment form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-4">
          <h2 className="font-semibold text-slate-900 mb-1">Pay via Mobile Money</h2>
          <p className="text-sm text-slate-400 mb-5">
            Enter your MoMo number below. You&apos;ll receive a payment prompt on your phone — approve it to activate your account.
          </p>
          <SubscribeForm
            amountGhs={parseFloat(s(settings, tier.monthly, "150").replace(/[^\d.]/g, "")) || 150}
            reference={schoolId}
          />
        </div>

        {/* WhatsApp fallback */}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-semibold transition-colors mb-4"
          >
            <MessageCircle className="w-4 h-4" />
            Prefer to pay via WhatsApp? Contact us
          </a>
        )}

        <p className="text-center text-xs text-slate-400">
          Your plan and pricing were set by the VerifyGate team based on your school size.{" "}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Contact us
            </a>
          )}{" "}
          if you have questions.
        </p>

      </div>
    </div>
  );
}
