import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-24 max-w-3xl mx-auto px-6 text-center">
      <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8" data-aos="fade-up">
        First month completely free, no credit card required
      </div>
      <h2 className="font-serif capitalize text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight" data-aos="fade-up">
        Your school can be live<br />by tomorrow morning.
      </h2>
      <p className="text-slate-500 text-lg mb-10 leading-relaxed" data-aos="fade-up" data-aos-delay="100">
        We handle the entire setup for you. Just tell us your school name and how many students you have,
        and we&apos;ll have everything ready within 24 hours.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4" data-aos="fade-up" data-aos-delay="200">
        <Link
          href="/get-started"
          className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-blue-200 inline-flex items-center gap-2 w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          Request a Free Demo <ArrowRight className="w-5 h-5" />
        </Link>
        <Link
          href="/pricing"
          className="border-2 border-slate-200 text-slate-700 px-10 py-4 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          View Pricing
        </Link>
      </div>
      <p className="text-slate-400 text-sm mt-6">No setup fee · No contracts · Cancel anytime</p>
    </section>
  );
}
