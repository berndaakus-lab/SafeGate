import { Users, Shield, Bell, CheckCircle2 } from "lucide-react";

const roles = [
  {
    icon: Users,
    iconColor: "text-blue-400",
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
    icon: Shield,
    iconColor: "text-green-400",
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
    icon: Bell,
    iconColor: "text-amber-400",
    role: "Parent",
    headline: "Peace of mind. Always.",
    points: [
      "Generate QR code in 30 seconds",
      "Authorise specific people per pickup",
      "SMS the moment child leaves school",
      "No app to download, just a link",
    ],
  },
];

export default function RolesSection() {
  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="font-serif capitalize text-4xl font-bold text-white mb-4">Built for everyone at your school</h2>
          <p className="text-slate-400 text-lg">Every role gets exactly what they need.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((p, i) => (
            <div key={p.role} className="bg-slate-800 rounded-2xl p-8 border border-slate-700" data-aos="fade-up" data-aos-delay={i * 150}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  <p.icon className={`w-6 h-6 ${p.iconColor}`} />
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
  );
}
