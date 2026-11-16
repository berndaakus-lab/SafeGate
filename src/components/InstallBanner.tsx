"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Download, ExternalLink, Share, Compass } from "lucide-react";

// Which iPhone/iPad browser this is: each puts "Add to Home Screen" somewhere
// different, and in-app browsers (WhatsApp, Facebook, Instagram...) have none.
type IOSBrowser = "safari" | "chrome" | "other" | "inapp";

function detectIOSBrowser(ua: string): IOSBrowser {
  if (/FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|Twitter|GSA\//i.test(ua)) return "inapp";
  if (/CriOS/i.test(ua)) return "chrome";
  if (/FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua)) return "other";
  // Real Safari says "Safari/"; other web views built on WebKit usually don't
  return /Safari\//i.test(ua) ? "safari" : "inapp";
}

function IOSSteps({ browser }: { browser: IOSBrowser }) {
  const share = <Share className="inline w-3.5 h-3.5 -mt-0.5 mx-0.5" aria-label="Share" />;
  if (browser === "inapp") {
    return (
      <>
        This page is open inside another app. Tap <strong>⋯</strong> and choose <strong>Open in Safari</strong>, then
        tap {share} <strong>Share</strong> and <strong>Add to Home Screen</strong>.
      </>
    );
  }
  return (
    <>
      Tap {share} <strong>Share</strong>{" "}
      {browser === "safari" ? "at the bottom of the screen" : browser === "chrome" ? "next to the address bar at the top" : "in the browser menu"},
      scroll down and tap <strong>Add to Home Screen</strong>. Use the browser&apos;s Share button, not a long-press on a picture.
      {browser === "safari" && (
        // WhatsApp, Instagram etc. open links in Apple's built-in viewer, which
        // reports itself exactly like Safari but has no Add to Home Screen
        <span className="block mt-1.5">
          Not in the list? You may be inside WhatsApp&apos;s viewer: tap the <Compass className="inline w-3.5 h-3.5 -mt-0.5 mx-0.5" aria-label="compass" />
          compass or <strong>Open in Safari</strong> first, then try again.
        </span>
      )}
    </>
  );
}

const FROM_APP_KEY = "vg:fromApp";
const INSTALLED_KEY = "vg:installed";
// How long to wait for Chrome's install offer before showing the manual steps
const PROMPT_WAIT_MS = 4000;

/** True when an Android page is shown inside another app (WhatsApp, Facebook,
 * Instagram...), where Android never offers to install. Links tapped in
 * WhatsApp open in a Chrome "custom tab" that looks like Chrome itself, but
 * its first page carries the app as referrer (android-app://com.whatsapp/),
 * which is remembered for the rest of the visit. */
function androidInApp(): boolean {
  const ua = navigator.userAgent;
  if (/; wv\)|FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|GSA\//i.test(ua)) return true;
  try {
    if (document.referrer.startsWith("android-app://")) sessionStorage.setItem(FROM_APP_KEY, "1");
    return sessionStorage.getItem(FROM_APP_KEY) === "1";
  } catch {
    return document.referrer.startsWith("android-app://");
  }
}

/** A link that makes Android open this same page in the Chrome app (or the
 * phone's normal browser if Chrome isn't installed). */
function openInChromeUrl(): string {
  const { host, pathname, search, href } = window.location;
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`;
}

type Mode = "ios" | "android-prompt" | "android-inapp" | "android-manual";

export default function InstallBanner() {
  const pathname = usePathname();
  const [prompt, setPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("android-prompt");
  const [iosBrowser, setIOSBrowser] = useState<IOSBrowser>("safari");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if user already dismissed this session
    if (sessionStorage.getItem("pwa-dismissed")) return;

    // iOS detection, Safari doesn't fire beforeinstallprompt
    // iPadOS reports itself as a Mac; a touch screen gives it away
    const ios =
      (/iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;
    if (ios) {
      setMode("ios");
      setIOSBrowser(detectIOSBrowser(navigator.userAgent));
      setVisible(true);
      return;
    }

    const android = /android/i.test(navigator.userAgent);
    // Most parents open the link from WhatsApp, where installing is impossible:
    // offer to open the page in Chrome, where the Install button then appears
    if (android && androidInApp()) {
      setMode("android-inapp");
      setVisible(true);
      return;
    }

    // Chrome / Samsung Internet / Edge offer a one-tap install
    let offered = false;
    const handler = (e: Event) => {
      e.preventDefault();
      offered = true;
      setPrompt(e);
      setMode("android-prompt");
      setVisible(true);
    };
    const installed = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {}
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    window.addEventListener("appinstalled", installed);

    // No offer on Android (Firefox, a recently closed install window, an old
    // phone): show the browser-menu steps instead, unless it was installed
    // from this browser before
    let alreadyInstalled = false;
    try {
      alreadyInstalled = localStorage.getItem(INSTALLED_KEY) === "1";
    } catch {}
    const timer = android && !alreadyInstalled
      ? window.setTimeout(() => {
          if (!offered) {
            setMode("android-manual");
            setVisible(true);
          }
        }, PROMPT_WAIT_MS)
      : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as any);
      window.removeEventListener("appinstalled", installed);
      window.clearTimeout(timer);
    };
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
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {mode === "ios" && <IOSSteps browser={iosBrowser} />}
              {mode === "android-prompt" && "Add to your home screen for quick access, works offline too."}
              {mode === "android-inapp" && (
                <>
                  This page is open inside another app (like WhatsApp), which can&apos;t install it. Open it in Chrome to
                  install.
                </>
              )}
              {mode === "android-manual" && (
                <>
                  Tap <strong>⋮</strong> at the top right of your browser, then <strong>Install app</strong> or{" "}
                  <strong>Add to Home screen</strong>.
                </>
              )}
            </p>
          </div>
          <button onClick={dismiss} className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        {mode === "android-prompt" && (
          <button
            onClick={install}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Install App
          </button>
        )}
        {mode === "android-inapp" && (
          <>
            <a
              href={openInChromeUrl()}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open in Chrome
            </a>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Didn&apos;t open? Tap <strong>⋮</strong> at the top right and choose <strong>Open in Chrome</strong>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
