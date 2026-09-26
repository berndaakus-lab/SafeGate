import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getSettings, s } from "@/lib/settings";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How VerifyGate collects, uses, and protects data for parents, guards, and schools.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
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

      <section className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}</p>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">What we collect</h2>
            <p>
              To run pickup verification, VerifyGate stores parent and staff account details, student
              names and class information, photos used for pickup verification, and a record of each
              pickup (who collected which child, when, and confirmed by which guard).
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">How we use it</h2>
            <p>
              This data is used only to operate the pickup verification and audit trail features your
              school signed up for, and to send pickup confirmation SMS messages to parents. We do not
              sell or rent your data to third parties.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Who can see it</h2>
            <p>
              Access is role-based. Guards see only the child and collector details needed to confirm a
              pickup. School admins see records for their own school. Parents see only their own
              children&apos;s records. VerifyGate staff access data only to provide support or fix issues,
              at your school&apos;s request.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Data retention & deletion</h2>
            <p>
              Pickup records are kept for as long as your school maintains an active account, to
              preserve the audit trail. A school admin can request deletion of a parent, student, or
              staff record at any time by contacting us.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Contact</h2>
            <p>
              Questions about this policy, or a request to access, correct, or delete your data, can be
              sent to{" "}
              {email ? (
                <a href={`mailto:${email}`} className="text-blue-700 font-medium hover:text-blue-800">{email}</a>
              ) : (
                "us"
              )}.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
