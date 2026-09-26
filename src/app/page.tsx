import Link from "next/link";
import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/home/Hero";
import ProblemSection from "@/components/home/ProblemSection";
import CapabilitiesGrid from "@/components/home/CapabilitiesGrid";
import HowItWorks from "@/components/home/HowItWorks";
import RolesSection from "@/components/home/RolesSection";
import TrustStats from "@/components/home/TrustStats";
import FinalCTA from "@/components/home/FinalCTA";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-xl text-slate-900">VerifyGate</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/company" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Company
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Pricing
            </Link>
            <Link href="/login" className="border border-border/50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Sign In
            </Link>
            <Link href="/get-started" className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Get Started</span>
            </Link>
          </div>
        </div>
      </nav>

      <Hero />
      <ProblemSection />
      <CapabilitiesGrid />
      <HowItWorks />
      <RolesSection />
      <TrustStats />
      <FinalCTA />

      <SiteFooter />
    </div>
  );
}
