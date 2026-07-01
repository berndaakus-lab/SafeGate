import Link from "next/link";
import { Shield, QrCode, Bell, ClipboardList } from "lucide-react";

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
        <Link
          href="/login"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          Trusted by schools across Ghana
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
            href="/login?role=parent"
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            I&apos;m a Parent
          </Link>
          <Link
            href="/login?role=staff"
            className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-slate-700 transition-colors"
          >
            I&apos;m a School Admin
          </Link>
          <Link
            href="/guard/scan"
            className="border-2 border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-colors"
          >
            Guard Scanner
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            How SafeGate works
          </h2>
          <p className="text-slate-500 text-center mb-14 text-lg">
            Three simple steps. Zero confusion at the gate.
          </p>
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
                desc: "The moment your child leaves school, you receive a notification: who picked them up and at what time.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-slate-100">{item.step}</span>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    {item.icon}
                  </div>
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
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-14">
          Everything your school needs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "QR Code Verification", desc: "One scan confirms the child, the authorized person, and logs the pickup." },
            { title: "Parent Notifications", desc: "Instant alerts when a child is picked up. Peace of mind, always." },
            { title: "Pickup Audit Trail", desc: "Every pickup is logged with time, date, guard name, and person." },
            { title: "Multiple Authorized Persons", desc: "Add grandparents, uncles, drivers — anyone you trust." },
            { title: "Works on any device", desc: "No app to install. Open a link on any phone, tablet, or computer." },
            { title: "School Admin Dashboard", desc: "Manage students, parents, staff, and view all pickup history." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="w-2 h-2 bg-blue-600 rounded-full mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to secure your school gate?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join schools in Ghana using SafeGate to protect their students every day.
          </p>
          <Link
            href="/login?role=staff"
            className="bg-white text-blue-600 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
        <p>© {new Date().getFullYear()} SafeGate. Built for schools in Ghana. 🇬🇭</p>
      </footer>
    </div>
  );
}
