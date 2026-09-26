import { Smartphone, QrCode, Bell } from "lucide-react";

const steps = [
  {
    step: "01",
    color: "bg-blue-600",
    icon: Smartphone,
    title: "Parent generates a QR code",
    desc: "Before school closes, the parent opens VerifyGate, selects their child, picks the authorised person, and generates a secure QR code, in under 30 seconds.",
    detail: "Works on any phone browser. No app download.",
  },
  {
    step: "02",
    color: "bg-indigo-600",
    icon: QrCode,
    title: "Guard scans at the gate",
    desc: "The security guard opens VerifyGate on any phone or tablet and scans the QR code. The child's photo, name, class, and the collector's details appear instantly.",
    detail: "Guard sees: child photo · authorised person · expiry time.",
  },
  {
    step: "03",
    color: "bg-green-600",
    icon: Bell,
    title: "Parent gets an SMS instantly",
    desc: "The moment the guard confirms the pickup, the parent receives an SMS: who took their child, from which school, and at what time. No surprises.",
    detail: "Even parents without smartphones get notified.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16" data-aos="fade-up">
        <h2 className="font-serif capitalize text-4xl font-bold text-slate-900 mb-4">How it works</h2>
        <p className="text-slate-500 text-lg">Three steps. The whole school is covered.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

        {steps.map((item, i) => (
          <div key={item.step} className="bg-white rounded-2xl border border-border/50 p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative z-10" data-aos="fade-up" data-aos-delay={i * 150}>
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
              <item.icon className="w-7 h-7 text-white" />
            </div>
            <div className="text-xs font-black text-slate-300 mb-2 tracking-widest">{item.step}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
            <p className="text-slate-600 leading-relaxed mb-4">{item.desc}</p>
            <p className="text-xs text-blue-700 font-medium bg-blue-50 rounded-lg px-3 py-2">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
