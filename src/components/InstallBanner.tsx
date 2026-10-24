"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Download } from "lucide-react";

export default function InstallBanner() {
  const pathname = usePathname();
  const [prompt, setPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if user already dismissed this session
    if (sessionStorage.getItem("pwa-dismissed")) return;

    // iOS detection, Safari doesn't fire beforeinstallprompt
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    // Android / Chrome / Edge
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  function dismiss() {
    sessionStorage.setItem("pwa-dismissed", "1");
    setVisible(false);
    setDismissed(true);
  }

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setVisible(false);
  }

  if (!visible || dismissed || pathname.startsWith("/walkthrough")) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-top-4 duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4">
        <div className="flex items-start gap-3">
          <Image src="/icon-192.png" alt="VerifyGate" width={40} height={40} className="rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">Install VerifyGate</p>
            {isIOS ? (
              <p className="text-xs text-slate-500 mt-0.5">
                Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong> to install.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                Add to your home screen for quick access, works offline too.
              </p>
            )}
          </div>
          <button onClick={dismiss} className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        {!isIOS && (
          <button
            onClick={install}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Install App
          </button>
        )}
      </div>
    </div>
  );
}
