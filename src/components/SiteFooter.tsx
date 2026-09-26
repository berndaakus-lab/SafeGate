import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { getSettings, s } from "@/lib/settings";
import CopyButton from "@/components/CopyButton";

const socialLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
};

export default async function SiteFooter() {
  const settings = await getSettings();

  const socials = Object.keys(socialLabels)
    .map((key) => ({ key, label: socialLabels[key], href: s(settings, key) }))
    .filter(({ href }) => href);

  return (
    <footer className="bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 pb-10 border-b border-slate-800">
          {/* Brand + contact */}
          <div className="sm:col-span-5">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/icon-192.png" alt="VerifyGate" width={28} height={28} className="rounded-md" />
              <span className="font-bold text-lg text-white">VerifyGate</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-5">
              Secure, digital pickup authorization for schools across Ghana.
            </p>
            <div className="space-y-2">
              {s(settings, "email") && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <a href={`mailto:${s(settings, "email")}`} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {s(settings, "email")}
                  </a>
                  <CopyButton text={s(settings, "email")} className="text-slate-600 hover:text-slate-300" />
                </div>
              )}
              {s(settings, "phone") && (
                <a href={`tel:${s(settings, "phone")}`} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  {s(settings, "phone")}
                </a>
              )}
              {s(settings, "whatsapp") && (
                <a
                  href={`https://wa.me/${s(settings, "whatsapp")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-green-400 text-sm transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  WhatsApp Us
                </a>
              )}
            </div>
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {socials.map(({ key, label, href }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navigate */}
          <div className="sm:col-span-3">
            <p className="text-xs font-bold font-mono text-slate-500 uppercase tracking-widest mb-4">Navigate</p>
            <div className="space-y-2.5">
              <Link href="/company" className="block text-slate-400 hover:text-white text-sm transition-colors">Company</Link>
              <Link href="/careers" className="block text-slate-400 hover:text-white text-sm transition-colors">Careers</Link>
              <Link href="/get-started" className="block text-slate-400 hover:text-white text-sm transition-colors">Contact</Link>
              <Link href="/privacy" className="block text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            </div>
          </div>

          {/* Product */}
          <div className="sm:col-span-4">
            <p className="text-xs font-bold font-mono text-slate-500 uppercase tracking-widest mb-4">Product</p>
            <div className="space-y-2.5">
              <Link href="/schools" className="block text-slate-400 hover:text-white text-sm transition-colors">For Schools</Link>
              <Link href="/pricing" className="block text-slate-400 hover:text-white text-sm transition-colors">Pricing</Link>
              <Link href="/get-started" className="block text-slate-400 hover:text-white text-sm transition-colors">Get Started</Link>
              <Link href="/login" className="block text-slate-400 hover:text-white text-sm transition-colors">Sign In</Link>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} VerifyGate. Built for schools in Ghana.</p>
          <p className="text-xs text-slate-500">
            Powered by <span className="font-semibold text-slate-300">BTS - Berndaakus Tech Solution</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
