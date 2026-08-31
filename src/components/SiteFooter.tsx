import Link from "next/link";
import Image from "next/image";
import { getSettings, s } from "@/lib/settings";

export default async function SiteFooter() {
  const settings = await getSettings();

  const socials = [
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "twitter", label: "X / Twitter" },
    { key: "linkedin", label: "LinkedIn" },
  ].filter(({ key }) => s(settings, key));

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image src="/icon-192.png" alt="VerifyGate" width={28} height={28} className="rounded-md" />
              <span className="font-bold text-slate-900">VerifyGate</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Secure school pickup authorization for schools across Ghana.
            </p>
            {socials.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socials.map(({ key, label }) => (
                  <a
                    key={key}
                    href={s(settings, key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Product</p>
              <div className="space-y-1.5">
                <Link href="/pricing" className="block text-slate-400 hover:text-slate-600 text-sm">Pricing</Link>
                <Link href="/get-started" className="block text-slate-400 hover:text-slate-600 text-sm">Get Started</Link>
                <Link href="/login" className="block text-slate-400 hover:text-slate-600 text-sm">Sign In</Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Contact</p>
              <div className="space-y-1.5">
                {s(settings, "email") && (
                  <a href={`mailto:${s(settings, "email")}`} className="block text-slate-400 hover:text-slate-600 text-sm">
                    {s(settings, "email")}
                  </a>
                )}
                {s(settings, "phone") && (
                  <a href={`tel:${s(settings, "phone")}`} className="block text-slate-400 hover:text-slate-600 text-sm">
                    {s(settings, "phone")}
                  </a>
                )}
                {s(settings, "whatsapp") && (
                  <a
                    href={`https://wa.me/${s(settings, "whatsapp")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-slate-400 hover:text-green-600 text-sm"
                  >
                    WhatsApp Us
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} VerifyGate 🇬🇭</p>
          <p className="text-xs text-slate-400">
            Powered by <span className="font-semibold text-slate-500">BTS — Berndaakus Tech Solution</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
