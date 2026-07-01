import Link from "next/link";
import { Shield, MessageCircle, Mail, CheckCircle2, ArrowLeft, Phone } from "lucide-react";
import ContactForm from "./ContactForm";

const WHATSAPP_NUMBER = "233XXXXXXXXX"; // Replace with your real WhatsApp number
const WHATSAPP_MSG = encodeURIComponent("Hi SafeGate! I'd like to learn more about getting my school onboarded.");

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">SafeGate</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            🎉 First month completely free
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Get your school onboarded today
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Join schools across Ghana using SafeGate to make every pickup safe, verified, and logged.
            We set everything up for you — your school can be live within 24 hours.
          </p>
        </div>

        {/* What you get */}
        <div className="bg-blue-600 rounded-2xl p-8 mb-12 text-white">
          <h2 className="font-bold text-xl mb-6">What you get in your free month</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Unlimited parent accounts",
              "Unlimited QR code scans",
              "SMS notifications to parents",
              "Guard scanner — no app needed",
              "Full pickup audit trail",
              "School admin dashboard",
              "Bulk student import",
              "Dedicated setup support",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-200 shrink-0" />
                <span className="text-blue-50 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-blue-200 text-sm mt-6">After your free month, plans start from as low as <strong className="text-white">GHS 150/month</strong> — less than GHS 5 a day.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Demo request form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8">
            <h2 className="font-bold text-slate-900 text-xl mb-2">Request a demo</h2>
            <p className="text-slate-500 text-sm mb-6">
              Fill in your details and we&apos;ll reach out within 24 hours to walk you through the platform.
            </p>
            <ContactForm />
          </div>

          {/* Quick contact options */}
          <div className="space-y-4">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 bg-green-500 hover:bg-green-600 transition-colors text-white rounded-2xl p-6"
            >
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-lg">Chat on WhatsApp</p>
                <p className="text-green-100 text-sm">Get a reply in minutes. Ask anything.</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:hello@safegate.app"
              className="flex items-center gap-5 bg-white hover:bg-slate-50 transition-colors border border-slate-100 rounded-2xl p-6"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Send an email</p>
                <p className="text-slate-400 text-sm">hello@safegate.app</p>
              </div>
            </a>

            {/* Call */}
            <a
              href="tel:+233XXXXXXXXX"
              className="flex items-center gap-5 bg-white hover:bg-slate-50 transition-colors border border-slate-100 rounded-2xl p-6"
            >
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Call us</p>
                <p className="text-slate-400 text-sm">Mon – Fri, 8am – 6pm</p>
              </div>
            </a>

            {/* Pricing teaser */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-sm text-slate-500 mb-2">Wondering about cost?</p>
              <Link href="/pricing" className="text-blue-600 font-semibold hover:underline text-sm">
                View our pricing plans →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
