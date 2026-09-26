import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Company",
  description: "The story behind VerifyGate, built in Ghana for schools that needed a better way to verify who picks up their students.",
  alternates: { canonical: "/company" },
};

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-xl text-slate-900">VerifyGate</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      {/* ── Banner ── */}
      <section className="relative overflow-hidden">
        <div className="relative h-72 sm:h-96 lg:h-[440px] xl:h-[500px]">
          <Image
            src="/company-background.jpg"
            alt="A school administrator checking her phone outside a school gate, with students and a security guard in the background"
            fill
            className="object-cover object-[center_30%]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-slate-950/10" />
          <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Company</h1>
            <p className="text-blue-200 text-lg font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">Built in Ghana, for schools that needed a better way.</p>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-4 text-center">
        <p className="text-xl sm:text-2xl text-blue-800 leading-relaxed font-medium" data-aos="fade-up">
          Our mission at VerifyGate is to give every school, however small, an affordable and reliable
          way to know exactly who is picking up their students, replacing paper notebooks and unanswered
          phone calls with a system every family can trust.
        </p>
        <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mt-8" />
      </section>

      {/* ── Our Story ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 order-2 lg:order-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6" data-aos="fade-up">Our Story</h2>
            <div className="space-y-4 text-slate-600 text-lg leading-relaxed" data-aos="fade-up" data-aos-delay="100">
              <p>
                I went to pick up my niece from her Montessori school. At the gate, the security guard
                opened a paper notebook. No photo. No ID check. Anyone could have said &quot;I&apos;m here
                for Ama&quot; and walked out with a child.
              </p>
              <p>
                I asked the proprietress about it. She told me they&apos;d been looking for a system for years,
                but everything out there needed expensive apps and reliable internet. Her guard has a basic phone.
                Her parents didn&apos;t want to download another app.
              </p>
              <p>
                So I built VerifyGate, right here in Ghana, for schools like hers, a QR-based pickup system
                that works on any phone browser, needs no app, and gives every school a full digital
                audit trail of every pickup.
              </p>
            </div>
            <Link href="/get-started" className="inline-block mt-8 text-blue-700 font-semibold text-sm hover:text-blue-800 border-b border-blue-200 hover:border-blue-400 transition-colors">
              Get your school started »
            </Link>
          </div>
          <div className="flex-1 order-1 lg:order-2" data-aos="fade-left">
            <div className="relative w-full max-w-sm mx-auto aspect-[4/5] rounded-3xl overflow-hidden">
              <Image
                src="/story.jpg"
                alt="A security guard writing in a paper notebook at a school gate as a student walks toward her waiting parent"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
