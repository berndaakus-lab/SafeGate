import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getSettings, s } from "@/lib/settings";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers",
  description: "Careers at VerifyGate.",
  alternates: { canonical: "/careers" },
};

export default async function CareersPage() {
  const settings = await getSettings();
  const email = s(settings, "email");

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-xl text-slate-900">VerifyGate</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Careers</h1>
        <p className="text-slate-600 text-lg leading-relaxed max-w-xl mx-auto">
          VerifyGate is a small, early-stage team, and we&apos;re not actively hiring right now.
          If you care about school safety technology in Ghana and want to be first in line when
          that changes, send us a note.
        </p>
        {email && (
          <a href={`mailto:${email}`} className="inline-block mt-8 text-blue-700 font-semibold text-sm hover:text-blue-800 border-b border-blue-200 hover:border-blue-400 transition-colors">
            {email}
          </a>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
