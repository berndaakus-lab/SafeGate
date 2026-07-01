import Link from "next/link";
import { Shield, QrCode, Bell, ClipboardList, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-100 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">SafeGate</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link
            href="/get-started"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          Built for schools in Ghana 🇬🇭
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          Every child leaves school<br />
          <span className="text-blue-600">safely, every time.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          SafeGate replaces phone calls and paper notebooks with a secure digital
          system. Parents authorize pickups. Guards verify instantly. Schools have
          a full audit trail.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/get-started"
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 inline-flex items-center gap-2"
          >
            Get Your School Onboarded <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="border-2 border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
        <p className="text-sm text-slate-400 mt-4">First month free · No setup fee · Cancel anytime</p>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">How SafeGate works</h2>
          <p className="text-slate-500 text-center mb-14 text-lg">Three simple steps. Zero confusion at the gate.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <ClipboardList className="w-6 h-6 text-blue-600" />,
                title: "Parent authorizes pickup",
                desc: "Select your child, choose who is picking them up, and generate a secure QR code — all in under 30 seconds.",
              },
              {
                step: "02",
                icon: <QrCode className="w-6 h-6 text-blue-600" />,
                title: "Guard scans at the gate",
                desc: "The security guard scans the QR code. The child's name, class, and the authorised person's full details appear instantly.",
              },
              {
                step: "03",
                icon: <Bell className="w-6 h-6 text-blue-600" />,
                title: "Parent is notified",
                desc: "The moment your child leaves school, you receive an SMS: who picked them up and at what time.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-slate-100">{item.step}</span>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">{item.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-14">Everything your school needs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "QR Code Verification", desc: "One scan confirms the child, the authorized person, and logs the pickup instantly." },
            { title: "SMS Notifications", desc: "Instant SMS alert to parents the moment their child is picked up. No app needed." },
            { title: "Pickup Audit Trail", desc: "Every pickup is logged with time, date, and the person who collected the child." },
            { title: "Multiple Authorised Persons", desc: "Add grandparents, aunts, uncles, drivers — anyone the parent trusts." },
            { title: "Works on any device", desc: "No app to install. Open a link on any phone, tablet, or computer." },
            { title: "School Admin Dashboard", desc: "Manage students, parents, staff, and view all pickup history in one place." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="w-2 h-2 bg-blue-600 rounded-full mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get onboarded today</h2>
          <p className="text-blue-100 text-lg mb-3">
            Your first month is completely free. After that, our plans are among the most affordable school safety tools in Ghana.
          </p>
          <p className="text-blue-200 text-sm mb-8">No setup fees. No contracts. Cancel anytime.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/get-started"
              className="bg-white text-blue-600 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Request a Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-blue-400 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">SafeGate</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/pricing" className="hover:text-slate-600">Pricing</Link>
            <Link href="/get-started" className="hover:text-slate-600">Get Started</Link>
            <Link href="/login" className="hover:text-slate-600">Sign In</Link>
          </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} SafeGate 🇬🇭</p>
        </div>
      </footer>
    </div>
  );
}
