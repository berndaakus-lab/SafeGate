import Link from "next/link";
import {
  Shield, QrCode, Bell, ClipboardList, CheckCircle2, ArrowRight,
  AlertTriangle, Smartphone, Users, Lock, BarChart3, Clock, PhoneCall,
  BookOpen, UserCheck,
} from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">VerifyGate</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
              Pricing
            </Link>
            <Link href="/get-started" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              Get Started Free
            </Link>
            <Link href="/login" className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors hidden sm:block">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Built for schools in Ghana 🇬🇭 — First month completely free
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6 max-w-4xl mx-auto">
            Know exactly who picks up<br />
            <span className="text-blue-400">your students. Every time.</span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            VerifyGate replaces paper notebooks and phone calls with a secure QR-based system.
            Parents authorize. Guards verify in seconds. Schools get a full digital audit trail.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
            <Link href="/get-started" className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-400 transition-colors shadow-xl shadow-blue-900 inline-flex items-center gap-2">
              Get Your School Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pricing" className="border-2 border-slate-600 text-slate-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-400 hover:text-blue-400 transition-colors">
              See Pricing
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            {[
              { value: "30 sec", label: "per pickup" },
              { value: "100%", label: "digital record" },
              { value: "0", label: "app downloads" },
              { value: "24 hrs", label: "to go live" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-slate-400 text-xs uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="bg-amber-50 border-y border-amber-100 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            <AlertTriangle className="w-3.5 h-3.5" />
            Sound familiar?
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Is this still happening at your school gate?
          </h2>
          <p className="text-slate-500 text-lg mb-10">
            Most schools in Ghana still rely on these — and they put children at risk every single day.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, text: "Paper notebooks where anyone can cross out a name" },
              { icon: PhoneCall, text: "Phone calls to verify parents that go unanswered" },
              { icon: AlertTriangle, text: "No record of who took which child or when" },
            ].map((p) => (
              <div key={p.text} className="bg-white border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-left">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <p.icon className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-sm mt-8">
            VerifyGate solves all three — with no hardware, no app, and no training needed.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">How it works</h2>
          <p className="text-slate-500 text-lg">Three steps. The whole school is covered.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

          {[
            {
              step: "01",
              color: "bg-blue-600",
              icon: <Smartphone className="w-7 h-7 text-white" />,
              title: "Parent generates a QR code",
              desc: "Before school closes, the parent opens VerifyGate, selects their child, picks the authorised person, and generates a secure QR code — in under 30 seconds.",
              detail: "Works on any phone browser. No app download.",
            },
            {
              step: "02",
              color: "bg-indigo-600",
              icon: <QrCode className="w-7 h-7 text-white" />,
              title: "Guard scans at the gate",
              desc: "The security guard opens VerifyGate on any phone or tablet and scans the QR code. The child's photo, name, class, and the collector's details appear instantly.",
              detail: "Guard sees: child photo · authorised person · expiry time.",
            },
            {
              step: "03",
              color: "bg-green-600",
              icon: <Bell className="w-7 h-7 text-white" />,
              title: "Parent gets an SMS instantly",
              desc: "The moment the guard confirms the pickup, the parent receives an SMS: who took their child, from which school, and at what time. No surprises.",
              detail: "Even parents without smartphones get notified.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm relative z-10">
              <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
                {item.icon}
              </div>
              <div className="text-xs font-black text-slate-200 mb-2 tracking-widest">{item.step}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-4">{item.desc}</p>
              <p className="text-xs text-blue-600 font-medium bg-blue-50 rounded-lg px-3 py-2">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who benefits ── */}
      <section className="bg-slate-900 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Built for everyone at your school</h2>
            <p className="text-slate-400 text-lg">Every role gets exactly what they need.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6 text-blue-400" />,
                role: "School Admin",
                headline: "Full control. Full visibility.",
                points: [
                  "Dashboard with all pickups in real time",
                  "Manage parents, students and staff",
                  "Bulk import your entire student list",
                  "Export pickup history anytime",
                ],
              },
              {
                icon: <Shield className="w-6 h-6 text-green-400" />,
                role: "Security Guard",
                headline: "No training needed.",
                points: [
                  "Scan QR code on any phone",
                  "See child photo + collector details",
                  "One tap to confirm pickup",
                  "Works offline-friendly on 2G/3G",
                ],
              },
              {
                icon: <Bell className="w-6 h-6 text-amber-400" />,
                role: "Parent",
                headline: "Peace of mind. Always.",
                points: [
                  "Generate QR code in 30 seconds",
                  "Authorise specific people per pickup",
                  "SMS the moment child leaves school",
                  "No app to download — just a link",
                ],
              },
            ].map((p) => (
              <div key={p.role} className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                    {p.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.role}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-5">{p.headline}</h3>
                <ul className="space-y-3">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything included. Nothing extra to buy.</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            One flat monthly fee covers your entire school — every parent, every student, every guard.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: QrCode, title: "QR Code Pickup Passes", desc: "Secure, time-limited QR codes generated by parents. Each code is unique and single-use.", color: "bg-blue-50 text-blue-600" },
            { icon: Bell, title: "Instant SMS Alerts", desc: "Parents receive an SMS the moment their child is picked up. Works on any phone — no data needed.", color: "bg-green-50 text-green-600" },
            { icon: ClipboardList, title: "Full Pickup Audit Trail", desc: "Every pickup is logged with the child, collector, time, and confirming guard. Exportable.", color: "bg-purple-50 text-purple-600" },
            { icon: UserCheck, title: "Authorised Person Profiles", desc: "Parents add grandparents, aunts, uncles, drivers — each with a name. Guards see exactly who to expect.", color: "bg-amber-50 text-amber-600" },
            { icon: Smartphone, title: "No App Download Needed", desc: "Everything runs in the browser. Parents, guards, and admins just open a link — on any phone.", color: "bg-rose-50 text-rose-600" },
            { icon: Lock, title: "Secure & Role-Based Access", desc: "Admins, guards, teachers, and parents each see only what they need. Nothing more.", color: "bg-indigo-50 text-indigo-600" },
            { icon: Users, title: "Bulk Student Import", desc: "Upload your full student list via CSV and be fully set up in minutes — not days.", color: "bg-cyan-50 text-cyan-600" },
            { icon: BarChart3, title: "Admin Dashboard", desc: "Real-time stats, recent pickups, parent and student management — all in one place.", color: "bg-emerald-50 text-emerald-600" },
            { icon: Clock, title: "Live within 24 Hours", desc: "We handle the setup. Your school can be fully onboarded and running the next day.", color: "bg-orange-50 text-orange-600" },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof / Trust ── */}
      <section className="bg-blue-50 border-y border-blue-100 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-10">Why schools in Ghana choose VerifyGate</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { stat: "< 30s", label: "Average pickup verification time" },
              { stat: "GHS 5/day", label: "Less than the cost of a daily snack" },
              { stat: "100%", label: "Web-based — works on any device, any network" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-5xl font-black text-blue-700 mb-2">{s.stat}</p>
                <p className="text-slate-600 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
          🎉 First month completely free — no credit card required
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 leading-tight">
          Your school can be live<br />by tomorrow morning.
        </h2>
        <p className="text-slate-500 text-lg mb-10 leading-relaxed">
          We handle the entire setup for you. Just tell us your school name and how many students you have —
          and we&apos;ll have everything ready within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/get-started"
            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-xl shadow-blue-200 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Request a Free Demo <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/pricing"
            className="border-2 border-slate-200 text-slate-700 px-10 py-4 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-colors w-full sm:w-auto text-center"
          >
            View Pricing
          </Link>
        </div>
        <p className="text-slate-400 text-sm mt-6">No setup fee · No contracts · Cancel anytime</p>
      </section>

      <SiteFooter />
    </div>
  );
}
