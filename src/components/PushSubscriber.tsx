"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSubscriber() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [requesting, setRequesting] = useState(false);

  async function syncSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const { key } = await fetch("/api/push/vapid-public-key").then((r) => r.json());
        if (!key) return;
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }

      // Always sync with the server, even if the browser already had a
      // subscription: a past server-side save could have failed silently
      // while the browser-level subscription still succeeded. Idempotent
      // upsert, so re-sending an already-saved subscription is a no-op.
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
    } catch (e) {
      // Silent, push is optional, SMS is fallback
      console.warn("[push] subscription failed:", e);
    }
  }

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "denied") return;

    // iOS only supports web push from an installed (standalone) PWA, never
    // from a regular Safari tab. Prompting there would show UI that can
    // never actually result in a delivered notification.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    if (isIOS && !isStandalone) return;

    if (Notification.permission === "granted") {
      syncSubscription();
      return;
    }

    // permission === "default": don't auto-request. iOS Safari silently
    // ignores requestPermission() calls that aren't triggered by a direct
    // user tap (and browsers generally move this direction over time), so
    // an automatic call here can leave the popup simply never appearing on
    // a brand-new device. Show a real button instead and request from its
    // click handler, which works reliably everywhere.
    if (sessionStorage.getItem("push-prompt-dismissed")) return;
    setShowPrompt(true);
  }, []);

  async function enable() {
    setRequesting(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") await syncSubscription();
    } finally {
      setRequesting(false);
      setShowPrompt(false);
    }
  }

  function dismiss() {
    sessionStorage.setItem("push-prompt-dismissed", "1");
    setShowPrompt(false);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">Turn on pickup alerts</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Get notified the instant your child is picked up, even if the app is closed.
            </p>
          </div>
          <button onClick={dismiss} className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={enable}
          disabled={requesting}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <Bell className="w-4 h-4" /> {requesting ? "Requesting..." : "Enable Notifications"}
        </button>
      </div>
    </div>
  );
}
