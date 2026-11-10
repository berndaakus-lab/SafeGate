import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getSettings, s } from "@/lib/settings";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

// Change this date only when the policy text changes
const LAST_UPDATED = "November 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How VerifyGate collects, uses, shares and protects data for parents, pickup persons, guards, and schools.",
  alternates: { canonical: "/privacy" },
};

const h2 = "text-lg font-bold text-slate-900 mb-2";
const ul = "list-disc pl-5 space-y-1.5 mt-2";

export default async function PrivacyPage() {
  const settings = await getSettings();
  const email = s(settings, "email");
  const contact = email ? (
    <a href={`mailto:${email}`} className="text-blue-700 font-medium hover:text-blue-800">{email}</a>
  ) : (
    "us through the school office"
  );

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
        <p className="text-slate-400 text-sm mb-6">Last updated {LAST_UPDATED}</p>
        <p className="text-slate-600 leading-relaxed mb-10">
          VerifyGate helps schools in Ghana check who is collecting a child at the school gate. This page explains,
          in plain language, what information we handle to do that, why, who can see it, and what choices you have.
          We handle personal data in line with Ghana&apos;s Data Protection Act, 2012 (Act 843).
        </p>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <div>
            <h2 className={h2}>Who is responsible for your data</h2>
            <p>
              Your child&apos;s school decides which children and parents are added to VerifyGate and uses the
              service to run its pickups. VerifyGate, a product of BTS (Berndaakus Tech Solution), provides the
              system and handles the data on the school&apos;s behalf. For questions about your own records, you can
              ask the school office or contact us at the address at the bottom of this page.
            </p>
          </div>

          <div>
            <h2 className={h2}>What we collect</h2>
            <p>We collect only what is needed to run pickup checks:</p>
            <ul className={ul}>
              <li><strong>Parents:</strong> name, phone number, email (optional), and a password. Passwords are stored in a scrambled form, so nobody at VerifyGate or the school can read them.</li>
              <li><strong>Children:</strong> name, class, and a photo. The school adds children to the system, and parents can update a child&apos;s photo or report a correction.</li>
              <li><strong>Pickup persons:</strong> for each person a parent authorises (for example a driver, relative or house help): name, phone number, relationship, a photo, and a car number for drivers.</li>
              <li><strong>Pickup passes and codes:</strong> the daily codes and regular pickup passes a parent creates, which children each one covers, and when it is valid.</li>
              <li><strong>Pickup records:</strong> who collected which child, when, how (daily code, regular pickup pass, or parent approval) and which guard or teacher confirmed it.</li>
              <li><strong>Approval requests:</strong> when a guard asks a parent to approve a pickup, we record the request and the parent&apos;s answer.</li>
              <li><strong>Staff:</strong> name, phone number, email and role for school admins, guards and teachers.</li>
              <li><strong>Notifications:</strong> the device details needed to send you notifications, and a record of which messages were sent and whether they were delivered.</li>
              <li><strong>Sign-in information:</strong> a session cookie that keeps you signed in for a short time while you use the app.</li>
            </ul>
          </div>

          <div>
            <h2 className={h2}>Photos and the people you add</h2>
            <p>
              Photos are used for one purpose: so a guard can match the person at the gate to the person you authorised.
              If you add someone as a pickup person, you are sharing their name, phone number, photo and car number with
              VerifyGate and the school. Please make sure they know and agree before you add them. Anyone you add can
              ask the school or us to correct or remove their details.
            </p>
          </div>

          <div>
            <h2 className={h2}>How we use it</h2>
            <ul className={ul}>
              <li>To check and record who collects each child, and to keep an audit trail for the school.</li>
              <li>To message parents: a confirmation after each pickup, and approval requests when someone arrives without a pass.</li>
              <li>To let a school admin manage accounts, classes and reports for their own school.</li>
              <li>To keep the service secure, fix problems, and answer support requests.</li>
            </ul>
            <p className="mt-2">
              We do not sell or rent your data, and we do not use it for advertising.
            </p>
          </div>

          <div>
            <h2 className={h2}>Who can see it</h2>
            <p>Access depends on role, and each school&apos;s data is kept separate from every other school&apos;s.</p>
            <ul className={ul}>
              <li><strong>Parents</strong> see only their own children and the pickup persons they added.</li>
              <li><strong>Guards and teachers</strong> see only what is needed to confirm a pickup for their own school: the child, the person collecting, and the pass.</li>
              <li><strong>School admins</strong> see the records of their own school.</li>
              <li><strong>VerifyGate staff</strong> look at data only to provide support or fix a problem, usually at the school&apos;s request.</li>
              <li><strong>Other families</strong> never see your details. When one driver collects for several families, the guard sees each family&apos;s children and the photo that family uploaded. The families do not see each other.</li>
            </ul>
          </div>

          <div>
            <h2 className={h2}>Services we use to run VerifyGate</h2>
            <p>
              We use trusted providers to store data and send messages. They process data only to provide their service
              to us:
            </p>
            <ul className={ul}>
              <li>Database, photo storage and hosting providers, to store records and photos and run the app.</li>
              <li>An SMS provider and web push services, to deliver notifications to parents.</li>
              <li>Paystack, to process school subscription payments. Paystack receives payment details directly; we do not store card numbers.</li>
            </ul>
            <p className="mt-2">
              Some of these providers run servers outside Ghana, so data may be processed in other countries. We choose
              providers that protect data to a similar standard, and we share only what each one needs.
            </p>
          </div>

          <div>
            <h2 className={h2}>How we protect it</h2>
            <ul className={ul}>
              <li>Connections to VerifyGate are encrypted.</li>
              <li>Passwords are stored in a scrambled form, and sign-ins expire after a period of inactivity.</li>
              <li>Access is limited by role and by school, and sign-in links and passes are long and hard to guess.</li>
              <li>Parents can cancel a regular pickup pass at any time, and it stops working immediately.</li>
              <li>Passwords can only be reset by the school admin, and a reset signs out the old password everywhere.</li>
            </ul>
            <p className="mt-2">
              No system is perfectly secure. If a problem affects your data, we will tell the affected school without
              unnecessary delay so it can inform parents.
            </p>
          </div>

          <div>
            <h2 className={h2}>How long we keep it</h2>
            <p>
              Pickup records are kept while your school has an active account, because they form the audit trail the
              school relies on. If a child leaves the school, or a parent asks, the school can archive or remove the
              child and the related details. When a school closes its account, it can ask us to delete its data. Records
              of message delivery are kept only as long as needed to investigate problems.
            </p>
          </div>

          <div>
            <h2 className={h2}>Your rights</h2>
            <p>You can ask, through your school or directly to us, to:</p>
            <ul className={ul}>
              <li>see the personal data we hold about you or your child,</li>
              <li>correct anything that is wrong (parents can also report a correction in the app),</li>
              <li>delete your data or a pickup person&apos;s data, where the school does not need it for its records,</li>
              <li>object to how your data is used, or withdraw your consent.</li>
            </ul>
            <p className="mt-2">
              If a request affects the school&apos;s attendance or safety records, the school may need to keep some
              information. We will explain why if that is the case.
            </p>
          </div>

          <div>
            <h2 className={h2}>Children&apos;s data</h2>
            <p>
              VerifyGate is used by schools, and children do not have accounts. A child&apos;s name, class and photo
              are added by the school, and they are used only to confirm that the right child goes home with the right
              person. We do not use children&apos;s data for advertising or share it for any other purpose.
            </p>
          </div>

          <div>
            <h2 className={h2}>Cookies</h2>
            <p>
              We use a cookie that keeps you signed in while you use the app. We do not use advertising or tracking
              cookies.
            </p>
          </div>

          <div>
            <h2 className={h2}>Changes to this policy</h2>
            <p>
              If we change this policy in a way that matters, we will update the date at the top of this page and tell
              schools so they can let parents know.
            </p>
          </div>

          <div>
            <h2 className={h2}>Contact</h2>
            <p>
              Questions about this policy, or a request to access, correct or delete your data, can be sent to {contact}.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
