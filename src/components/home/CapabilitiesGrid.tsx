import { QrCode, ScanLine, Bell, ClipboardList, Users, Lock } from "lucide-react";

const capabilities = [
  {
    icon: QrCode,
    title: "QR Pickup Passes",
    desc: "Parents generate a secure, single-use QR code for whoever is collecting their child that day, in under 30 seconds.",
  },
  {
    icon: ScanLine,
    title: "Guard Verification",
    desc: "Guards scan the code on any phone or tablet. The child's photo, class, and the collector's name appear instantly.",
  },
  {
    icon: Bell,
    title: "Instant SMS Alerts",
    desc: "The moment a pickup is confirmed, the parent gets a text: who collected their child, and at what time.",
  },
  {
    icon: ClipboardList,
    title: "Full Audit Trail",
    desc: "Every pickup is logged with the child, collector, time, and confirming guard, searchable and exportable.",
  },
  {
    icon: Users,
    title: "Bulk Student Import",
    desc: "Upload your entire student list by CSV and have the whole school set up in minutes, not days.",
  },
  {
    icon: Lock,
    title: "Role-Based Access",
    desc: "Admins, guards, and parents each see only what they need at the gate, nothing more.",
  },
];

export default function CapabilitiesGrid() {
  return (
    <section className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16" data-aos="fade-up">
        <h2 className="font-serif capitalize text-4xl font-bold text-slate-900 mb-4">How VerifyGate helps your school</h2>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          One flat monthly fee. Everything below is included for every parent, guard, and admin.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {capabilities.map((c, i) => (
          <div
            key={c.title}
            className="border border-border/50 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            data-aos="fade-up"
            data-aos-delay={(i % 3) * 100}
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <c.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{c.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
