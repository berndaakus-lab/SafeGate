import { AlertTriangle, BookOpen, PhoneCall } from "lucide-react";

const problems = [
  { icon: BookOpen, text: "Paper notebooks where anyone can cross out a name" },
  { icon: PhoneCall, text: "Phone calls to verify parents that go unanswered" },
  { icon: AlertTriangle, text: "No record of who took which child or when" },
];

export default function ProblemSection() {
  return (
    <section className="bg-amber-50 border-y border-amber-100 py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6" data-aos="fade-up">
          <AlertTriangle className="w-3.5 h-3.5" />
          Sound familiar?
        </div>
        <h2 className="font-serif capitalize text-3xl font-bold text-slate-900 mb-4" data-aos="fade-up">
          Is this still happening at your school gate?
        </h2>
        <p className="text-slate-600 text-lg mb-10" data-aos="fade-up">
          Most schools in Ghana still rely on these, and they put children at risk every single day.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {problems.map((p, i) => (
            <div key={p.text} className="bg-white border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-left" data-aos="fade-up" data-aos-delay={i * 100}>
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <p.icon className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm mt-8">
          VerifyGate solves all three, with no hardware, no app, and no training needed.
        </p>
      </div>
    </section>
  );
}
