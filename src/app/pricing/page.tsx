import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CheckCircle2, ArrowRight, ArrowLeft, MessageCircle, Star } from "lucide-react";
import { getSettings, s } from "@/lib/settings";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for VerifyGate, digital school pickup authorization for schools in Ghana. QR passes, SMS alerts, and a full audit trail included.",
  alternates: { canonical: "/pricing" },
};

const FEATURES = [
  "Unlimited QR code scans",
  "Guard scanner, no app needed",
  "Parent & student accounts",
  "Multiple admin accounts",
  "Guard & teacher roles",
  "Student photo ID",
  "Bulk parent & student import",
  "Full pickup audit trail",
  "Priority support",
];

const TIERS = [
  {
    name: "Standard",
    students: "Up to 100 students",
    smsCap: "2,500 SMS included/month",
    highlight: false,
    extras: [],
  },
  {
    name: "Growth",
    students: "101 – 500 students",
    smsCap: "12,000 SMS included/month",
    highlight: true,
    badge: "Most Popular",
    extras: [],
  },
  {
    name: "Premier",
    students: "501 – 1,000 students",
    smsCap: "24,000 SMS included/month",
    highlight: false,
    extras: [],
  },
  {
    name: "Enterprise",
    students: "Multiple campuses or custom",
    smsCap: "Custom SMS volume",
    highlight: false,
    badge: "Custom",
    extras: [
      "Custom SMS sender ID (your school name)",
      "Co-branded parent experience",
      "Dedicated onboarding manager",
      "Phone & WhatsApp support",
      "SLA & uptime guarantee",
    ],
  },
];

export default async function PricingPage() {
  const settings = await getSettings();
  const whatsapp = s(settings, "whatsapp", "233XXXXXXXXX");
  const waMsg = encodeURIComponent(
    "Hi VerifyGate! I'd like to get a price quote for my school. Can we talk?"
  );
  const waLink = `https://wa.me/${whatsapp}?text=${waMsg}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
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

      {/* Sticky WhatsApp CTA */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-green-900/30 font-bold text-sm transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
        Get a Quote
      </a>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-14" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            First month completely free, no credit card needed
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Priced for your school size
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-6">
            Every feature included on every plan. No per-parent fees, no per-scan charges.
            One flat rate covers your entire school.
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-3 rounded-xl text-sm font-semibold">
            Starting from <span className="font-black text-blue-900 text-base mx-1">GH₵150/month</span> · First month completely free
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {TIERS.map((tier, i) => {
            const isEnterprise = tier.name === "Enterprise";
            const isDark = isEnterprise;
            return (
              <div
                key={tier.name}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className={`rounded-2xl flex flex-col relative overflow-hidden ${
                  tier.highlight
                    ? "bg-blue-600 shadow-2xl shadow-blue-200 ring-2 ring-blue-400"
                    : isDark
                    ? "bg-slate-900 shadow-xl"
                    : "bg-white border border-slate-100 shadow-sm"
                }`}
              >
                {tier.badge && (
                  <span className="absolute top-0 right-0 text-xs font-black px-3 py-1 rounded-bl-xl bg-amber-400 text-amber-900">
                    {tier.badge}
                  </span>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-5">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${
                      tier.highlight ? "text-blue-200" : isDark ? "text-slate-400" : "text-slate-400"
                    }`}>
                      {tier.students}
                    </p>
                    <h2 className={`font-black text-xl mb-4 ${
                      tier.highlight ? "text-white" : isDark ? "text-white" : "text-slate-900"
                    }`}>
                      {tier.name}
                    </h2>

                    <div className={`rounded-xl px-4 py-3 mb-1 ${
                      tier.highlight ? "bg-blue-700/50" : isDark ? "bg-slate-800" : "bg-slate-50"
                    }`}>
                      <p className={`font-black text-lg ${tier.highlight ? "text-white" : isDark ? "text-white" : "text-slate-900"}`}>
                        Contact us
                      </p>
                      <p className={`text-xs mt-0.5 ${tier.highlight ? "text-blue-300" : "text-slate-400"}`}>
                        First month free · WhatsApp us for pricing
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                        tier.highlight ? "text-blue-200" : isDark ? "text-blue-400" : "text-blue-500"
                      }`} />
                      <span className={`text-xs leading-relaxed font-semibold ${
                        tier.highlight ? "text-blue-50" : isDark ? "text-slate-300" : "text-slate-600"
                      }`}>{tier.smsCap}</span>
                    </li>
                    {FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                          tier.highlight ? "text-blue-200" : isDark ? "text-blue-400" : "text-blue-500"
                        }`} />
                        <span className={`text-xs leading-relaxed ${
                          tier.highlight ? "text-blue-50" : isDark ? "text-slate-300" : "text-slate-600"
                        }`}>{f}</span>
                      </li>
                    ))}
                    {tier.extras.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Star className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <span className="text-xs leading-relaxed text-amber-300 font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${
                      tier.highlight
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : isEnterprise
                        ? "bg-amber-400 text-amber-900 hover:bg-amber-300"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Get a Quote
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mb-14 -mt-8">
          Extra SMS beyond your plan's included volume billed at GH₵0.05/SMS. Most schools never come close to their limit.
        </p>

        {/* What's included, full feature breakdown */}
        <div className="bg-white border border-slate-100 rounded-2xl p-8 mb-12" data-aos="fade-up">
          <h2 className="font-bold text-slate-900 text-xl mb-2 text-center">Everything included on every plan</h2>
          <p className="text-slate-400 text-sm text-center mb-8">No locked features. No upsells. Your plan size only determines how many students you can enroll.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "QR Code Pickup", desc: "Parents generate a secure QR code per pickup in under 30 seconds. No app download needed." },
              { title: "Guard Scanner", desc: "Security guard scans from any phone or tablet. Shows child photo and authorised collector instantly." },
              { title: "SMS Notifications", desc: "Parent receives an SMS the moment their child is confirmed picked up. Works on any network." },
              { title: "Pickup Audit Trail", desc: "Every pickup logged with time, collector name, and guard who confirmed. Searchable forever." },
              { title: "Admin Dashboard", desc: "Real-time view of today's pickups, all parents, all students, and school activity." },
              { title: "Multiple Roles", desc: "Separate logins for school admins, security guards, and teachers, each sees only what they need." },
              { title: "Student Photo ID", desc: "Upload student photos so guards can visually confirm the right child every time." },
              { title: "Bulk Import", desc: "Upload a spreadsheet to add hundreds of students and parents at once. No manual entry." },
              { title: "Authorised Collectors", desc: "Parents can set different collectors per pickup, not just one saved contact." },
              { title: "Flexible Billing", desc: "Pay for 1, 3, 6 or 12 months at a time. Simple mobile money payment, no bank card needed." },
              { title: "No Hardware Needed", desc: "Runs on any smartphone. No devices, scanners, or equipment to buy or maintain." },
              { title: "Fast Setup", desc: "Your school can be live and scanning in under 24 hours. We handle the onboarding." },
            ].map((f) => (
              <div key={f.title} className="flex gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{f.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-12" data-aos="fade-up">
          <h2 className="font-bold text-slate-900 text-xl mb-8 text-center">Common questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { q: "How much does it cost?", a: "Pricing depends on your school size and needs. Contact us on WhatsApp and we'll give you an exact quote, usually within minutes." },
              { q: "Do I need a credit card to start?", a: "No. Your first month is completely free with no payment details required. We'll reach out before the trial ends." },
              { q: "What happens after the free month?", a: "We'll contact you to arrange payment via mobile money. Pay for 1, 3, 6 or 12 months at a time, your choice." },
              { q: "Can parents use VerifyGate for free?", a: "Yes. Parents never pay anything. The school subscription covers every parent, student, and guard account." },
              { q: "Is the price per branch or per school?", a: "Per school campus. Running multiple branches? Contact us and we'll work out a group rate." },
              { q: "Do you support international schools?", a: "Yes, our International plan includes a custom SMS sender ID with your school name, co-branded experience, and a dedicated support contact." },
              { q: "How do you handle student data?", a: "All data is stored securely and never shared with third parties. Child safety and privacy are our top priorities." },
              { q: "Can we cancel anytime?", a: "Yes, no contracts or lock-in. If you need to cancel, just let us know and we'll sort it out promptly." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold text-slate-900 text-sm mb-1">{q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-12 text-center" data-aos="zoom-in">
          <h2 className="text-3xl font-black text-white mb-3">Ready to get a price for your school?</h2>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto">
            Tell us your school name and how many students you have. We&apos;ll send you an exact quote and set up your free month, usually same day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl transition-all hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Us for a Quote
            </a>
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 border-2 border-slate-600 text-slate-300 hover:border-blue-400 hover:text-blue-400 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Fill in a Request Form <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-6">
            Or visit <Link href="/schools" className="text-blue-400 hover:underline">verifygate.app/schools</Link> to see VerifyGate in action
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
