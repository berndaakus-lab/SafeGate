import Link from "next/link";
import Image from "next/image";
import { Shield, ArrowRight } from "lucide-react";

const stats = [
  { value: "30 sec", label: "per pickup" },
  { value: "100%", label: "digital record" },
  { value: "0", label: "app downloads" },
  { value: "24 hrs", label: "to go live" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[600px] lg:h-[85vh] flex items-center">
      <Image
        src="/background-image-hero.jpg"
        alt="Aerial view of a school campus in Ghana, gate, courtyard, and school buses"
        fill
        priority
        className="object-cover animate-hero-zoom"
      />
      <div className="absolute inset-0 bg-slate-950/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/25 to-slate-950/45" />

      <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="max-w-2xl">
          <div
            className="animate-hero-rise inline-flex items-center gap-2 bg-slate-950/50 backdrop-blur-sm border border-blue-400/30 text-blue-200 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
            style={{ animationDelay: "0ms" }}
          >
            <Shield className="w-4 h-4" />
            Built for schools in Ghana, first month completely free
          </div>

          <h1
            className="animate-hero-rise-blur font-serif capitalize text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6 drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)]"
            style={{ animationDelay: "150ms" }}
          >
            Know exactly who picks up{" "}
            <span className="text-blue-300">your students. Every time.</span>
          </h1>

          <p
            className="animate-hero-rise text-lg text-slate-100 mb-10 leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]"
            style={{ animationDelay: "380ms" }}
          >
            VerifyGate replaces paper notebooks and phone calls with a secure QR-based system.
            Parents authorize. Guards verify in seconds. Schools get a full digital audit trail.
          </p>

          <div className="animate-hero-rise flex items-center gap-4 flex-wrap mb-12" style={{ animationDelay: "520ms" }}>
            <Link href="/get-started" className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-400 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-black/40 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="animate-hero-rise flex flex-wrap items-center gap-8 text-sm" style={{ animationDelay: "650ms" }}>
            {stats.map((s) => (
              <div key={s.label} className="drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-slate-200 text-xs uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
