import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { getSettings, s } from "@/lib/settings";
import SubscribeForm from "./SubscribeForm";
import Image from "next/image";
import { CheckCircle2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  BILLING_PERIODS,
  TIERS,
  monthlyPriceGhs,
  periodPriceGhs,
  subscriptionState,
  tierOf,
} from "@/lib/subscription";

export const dynamic = "force-dynamic";

const FEATURES = [
  "Unlimited QR code scans",
  "SMS notifications to parents",
  "Guard scanner, no app needed",
  "Multiple admin accounts",
  "Guard & teacher roles",
  "Student photo ID",
  "Bulk parent & student import",
  "Full pickup audit trail",
];

export default async function SubscribePage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) redirect("/login?reason=signin&for=admin");

  const [{ data: school }, settings] = await Promise.all([
    supabaseAdmin
      .from("schools")
      .select("name, plan, trial_ends_at, paid_until, custom_price")
      .eq("id", schoolId)
      .single(),
    getSettings(),
  ]);

  const tier = TIERS[tierOf(school?.plan)];
  const monthly = school ? monthlyPriceGhs(school, settings) : null;
  const state = school ? subscriptionState(school) : { kind: "none" as const };
  const periods = monthly ? BILLING_PERIODS.map((months) => ({ months, amount: periodPriceGhs(monthly, months) })) : [];

  const whatsapp = s(settings, "whatsapp", "");
  const waMsg = encodeURIComponent(
    `Hi VerifyGate! I'd like to pay for my school (${school?.name ?? ""}) and need help with the payment. Can you assist?`
  );

  const statusLine =
    state.kind === "paid"
      ? `Paid until ${formatDate(state.endsAt.toISOString())}. Paying now adds time after that date.`
      : state.kind === "trial"
        ? `Free trial until ${formatDate(state.endsAt.toISOString())}. Your paid time starts after the trial, so you don't lose any free days.`
        : state.kind === "expired"
          ? `Your ${state.wasPaid ? "subscription" : "free trial"} ended on ${formatDate(state.endedAt.toISOString())}.`
          : null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-5">
            <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-xl text-slate-900">VerifyGate</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {state.kind === "paid" ? "Renew your subscription" : "Activate your subscription"}
          </h1>
          <p className="text-slate-500 text-sm">{school?.name} · Pay via Mobile Money.</p>
          {statusLine && (
            <p className={`mt-3 text-sm rounded-xl px-4 py-2.5 ${state.kind === "expired" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-800"}`}>
              {statusLine}
            </p>
          )}
        </div>

        <div className="bg-blue-600 rounded-2xl p-6 mb-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Your plan</p>
              <p className="text-white font-black text-2xl">{tier.label}</p>
              <p className="text-blue-200 text-sm">{tier.sub}</p>
            </div>
            {monthly && (
              <div className="text-right">
                <p className="text-blue-200 text-xs mb-1">{school?.custom_price ? "Your agreed price" : "Price"}</p>
                <p className="text-white font-black text-xl">GHS {monthly.toLocaleString()}</p>
                <p className="text-blue-200 text-xs">/month</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <span className="text-blue-50 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-4">
          {monthly ? (
            <>
              <h2 className="font-semibold text-slate-900 mb-1">Pay via Mobile Money</h2>
              <p className="text-sm text-slate-400 mb-5">
                Choose how long to pay for, then enter your MoMo number. Approve the prompt on your phone to confirm.
              </p>
              <SubscribeForm periods={periods} />
            </>
          ) : (
            <div className="text-center py-2">
              <h2 className="font-semibold text-slate-900 mb-1">Your price is being arranged</h2>
              <p className="text-sm text-slate-500">
                The VerifyGate team will agree a price with your school. Contact us below to pay.
              </p>
            </div>
          )}
        </div>

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
          Your plan and price were set by the VerifyGate team for your school.{" "}
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
