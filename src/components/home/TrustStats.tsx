const stats = [
  { stat: "< 30s", label: "Average pickup verification time" },
  { stat: "Zero", label: "Extra hardware or devices needed" },
  { stat: "100%", label: "Web-based, works on any device, any network" },
];

export default function TrustStats() {
  return (
    <section className="bg-blue-50 border-y border-blue-100 py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-10" data-aos="fade-up">Why schools in Ghana choose VerifyGate</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((s, i) => (
            <div key={s.label} data-aos="zoom-in" data-aos-delay={i * 100}>
              <p className="text-5xl font-black text-blue-700 mb-2">{s.stat}</p>
              <p className="text-slate-600 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
