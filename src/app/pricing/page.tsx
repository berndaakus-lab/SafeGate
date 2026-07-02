import Link from "next/link";
import { Shield, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { getSettings, s } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const settings = await getSettings();

  const plans = [
    {
      name: "Starter",
      price: s(settings, "plan_starter_price", "Free"),
      period: s(settings, "plan_starter_note", "first month"),
      description: "Try every feature free for 30 days. No card required.",
      highlight: false,
      cta: "Start Free",
      href: "/get-started?plan=starter",
      features: [
        "Up to 100 students",
        "Unlimited QR scans",
        "SMS notifications",
        "Parent accounts",
        "Guard scanner",
        "Pickup audit trail",
        "Email support",
      ],
    },
    {
      name: "School",
      price: s(settings, "plan_school_price", "GHS 150"),
      period: s(settings, "plan_school_note", "per month"),
      description: "Everything a single school needs. Affordable, all-inclusive.",
      highlight: true,
      badge: "Most Popular",
      cta: "Get Started",
      href: "/get-started?plan=school",
      features: [
        "Unlimited students",
        "Unlimited QR scans",
        "SMS notifications",
        "Multiple admin accounts",
        "Guard & teacher roles",
        "Bulk student import",
        "Student photo ID",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: s(settings, "plan_enterprise_price", "Custom"),
      period: s(settings, "plan_enterprise_note", "contact us"),
      description: "Multiple campuses, group management, and a dedicated account manager.",
      highlight: false,
      cta: "Talk to Us",
      href: "/get-started?plan=enterprise",
      features: [
        "Multiple school branches",
        "Centralised dashboard",
        "Custom sender ID for SMS",
        "Data export & reports",
        "Dedicated onboarding",
        "SLA & uptime guarantee",
        "Phone support",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">VerifyGate</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <Link href="/login" className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple, honest pricing</h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            No hidden fees. No per-parent charges. One flat rate covers your entire school.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            🎉 First month free on any plan — no credit card needed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col relative ${
                plan.highlight ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-white border border-slate-100"
              }`}
            >
              {(plan as any).badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                  {(plan as any).badge}
                </span>
              )}
              <div className="mb-6">
                <h2 className={`font-bold text-lg mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h2>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlight ? "text-blue-200" : "text-slate-400"}`}>/ {plan.period}</span>
                </div>
                <p className={`text-sm ${plan.highlight ? "text-blue-100" : "text-slate-500"}`}>{plan.description}</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-600"}`} />
                    <span className={`text-sm ${plan.highlight ? "text-blue-50" : "text-slate-600"}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {plan.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <h2 className="font-bold text-slate-900 text-xl mb-8 text-center">Common questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { q: "Do I need a credit card to start?", a: "No. Your first month is completely free with no payment details required. We'll reach out before the trial ends." },
              { q: "What happens after the free month?", a: "We'll contact you to set up a simple monthly or annual payment. Annual plans get 2 months free." },
              { q: "Can parents use VerifyGate for free?", a: "Yes. Parents never pay anything. The school subscription covers all parent and student accounts." },
              { q: "Is the price per branch or per school?", a: "Per school. One flat fee covers all parents, students, guards, and teachers at one location." },
              { q: "What SMS provider do you use?", a: "We use Nkomo SMS, a reliable Ghanaian provider. SMS costs are included in your subscription." },
              { q: "Can we cancel anytime?", a: "Yes, no contracts. If you need to cancel, just let us know and we'll sort it out." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold text-slate-900 text-sm mb-1">{q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-500 mb-4">Still have questions? We&apos;re happy to help.</p>
          <Link href="/get-started" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Talk to the VerifyGate team <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
