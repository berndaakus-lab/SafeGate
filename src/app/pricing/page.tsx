import Link from "next/link";
import { Shield, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const TIERS = [
  {
    name: "Standard",
    students: "Up to 100 students",
    monthly: "GHS 150",
    annual: "GHS 1,500",
    annualNote: "Save GHS 300",
    highlight: false,
    href: "/get-started?plan=standard",
  },
  {
    name: "Growth",
    students: "101 – 500 students",
    monthly: "GHS 250",
    annual: "GHS 2,500",
    annualNote: "Save GHS 500",
    highlight: true,
    badge: "Most Popular",
    href: "/get-started?plan=growth",
  },
  {
    name: "Premier",
    students: "500+ students",
    monthly: "GHS 400",
    annual: "GHS 4,000",
    annualNote: "Save GHS 800",
    highlight: false,
    href: "/get-started?plan=premier",
  },
];

const FEATURES = [
  "Unlimited QR code scans",
  "SMS notifications to parents",
  "Guard scanner — no app needed",
  "Parent & student accounts",
  "Multiple admin accounts",
  "Guard & teacher roles",
  "Student photo ID",
  "Bulk parent & student import",
  "Full pickup audit trail",
  "Priority support",
];

export default function PricingPage() {
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
            Priced by school size. Every feature included. No per-parent or per-scan fees.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
              🎉 First month free — no credit card needed
            </div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
              📅 Annual plan = 2 months free
            </div>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl flex flex-col relative overflow-hidden ${
                tier.highlight
                  ? "bg-blue-600 text-white shadow-2xl shadow-blue-200 ring-2 ring-blue-400"
                  : "bg-white border border-slate-100 shadow-sm"
              }`}
            >
              {tier.badge && (
                <span className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-black px-4 py-1 rounded-bl-xl">
                  {tier.badge}
                </span>
              )}
              <div className="p-8 pb-6">
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${tier.highlight ? "text-blue-200" : "text-slate-400"}`}>
                  {tier.students}
                </p>
                <h2 className={`font-black text-2xl mb-5 ${tier.highlight ? "text-white" : "text-slate-900"}`}>
                  {tier.name}
                </h2>

                {/* Monthly */}
                <div className={`rounded-xl p-4 mb-3 ${tier.highlight ? "bg-blue-700/50" : "bg-slate-50"}`}>
                  <p className={`text-xs font-semibold mb-1 ${tier.highlight ? "text-blue-200" : "text-slate-400"}`}>Monthly</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl font-black ${tier.highlight ? "text-white" : "text-slate-900"}`}>{tier.monthly}</span>
                    <span className={`text-sm mb-1 ${tier.highlight ? "text-blue-200" : "text-slate-400"}`}>/mo</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${tier.highlight ? "text-blue-300" : "text-slate-400"}`}>First month free</p>
                </div>

                {/* Annual */}
                <div className={`rounded-xl p-4 border-2 ${tier.highlight ? "border-blue-400/50 bg-blue-500/30" : "border-blue-100 bg-blue-50"}`}>
                  <p className={`text-xs font-semibold mb-1 ${tier.highlight ? "text-blue-200" : "text-blue-600"}`}>Annual billing</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl font-black ${tier.highlight ? "text-white" : "text-blue-700"}`}>{tier.annual}</span>
                    <span className={`text-sm mb-1 ${tier.highlight ? "text-blue-200" : "text-blue-400"}`}>/yr</span>
                  </div>
                  <p className={`text-xs mt-0.5 font-semibold ${tier.highlight ? "text-green-300" : "text-green-600"}`}>
                    ✓ {tier.annualNote} (2 months free)
                  </p>
                </div>
              </div>

              <div className="px-8 pb-8 flex-1 flex flex-col">
                <ul className="space-y-2.5 mb-8 flex-1">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${tier.highlight ? "text-blue-200" : "text-blue-500"}`} />
                      <span className={`text-sm ${tier.highlight ? "text-blue-50" : "text-slate-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-colors ${
                    tier.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick compare table */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-12">
          <div className="px-8 py-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">At a glance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-8 py-3 text-slate-400 font-medium">Plan</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">School size</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Monthly</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Annual</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Per day</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Standard", size: "Up to 100", monthly: "GHS 150", annual: "GHS 1,500", day: "GHS 5" },
                  { name: "Growth", size: "101 – 500", monthly: "GHS 250", annual: "GHS 2,500", day: "GHS 8.33", highlight: true },
                  { name: "Premier", size: "500+", monthly: "GHS 400", annual: "GHS 4,000", day: "GHS 13.33" },
                ].map((row) => (
                  <tr key={row.name} className={`border-b border-slate-50 ${row.highlight ? "bg-blue-50/50" : ""}`}>
                    <td className="px-8 py-4 font-semibold text-slate-900">
                      {row.name}
                      {row.highlight && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Popular</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{row.size} students</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{row.monthly}<span className="text-slate-400 font-normal">/mo</span></td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{row.annual}<span className="text-slate-400 font-normal">/yr</span></td>
                    <td className="px-6 py-4 text-slate-500">{row.day}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-400">All plans include every feature. Price is per school, not per student or per user. First month is free on all plans.</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-12">
          <h2 className="font-bold text-slate-900 text-xl mb-8 text-center">Common questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { q: "Do I need a credit card to start?", a: "No. Your first month is completely free with no payment details required. We'll reach out before the trial ends." },
              { q: "What happens after the free month?", a: "We'll contact you to set up a monthly or annual payment via mobile money. Annual plans get 2 months free." },
              { q: "Can parents use VerifyGate for free?", a: "Yes. Parents never pay anything. The school subscription covers all parent and student accounts." },
              { q: "Is the price per branch or per school?", a: "Per school campus. For multiple branches, contact us for an enterprise arrangement." },
              { q: "What SMS provider do you use?", a: "We use a reliable Ghanaian SMS provider. SMS costs are included in your subscription — no hidden charges." },
              { q: "Can we cancel anytime?", a: "Yes, no contracts or lock-in. If you need to cancel, just let us know and we'll sort it out promptly." },
              { q: "Do you support international schools?", a: "Yes. VerifyGate works for any school in Ghana regardless of curriculum — Cambridge, IB, GES, or private." },
              { q: "How do you handle student data?", a: "All data is stored securely and never shared with third parties. We take child safety and data privacy very seriously." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold text-slate-900 text-sm mb-1">{q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-500 mb-4">Still have questions? We&apos;re happy to help.</p>
          <Link href="/get-started" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Talk to the VerifyGate team <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
