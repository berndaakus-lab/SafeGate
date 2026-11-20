"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { enablePush, getPushStatus, syncSubscription } from "@/lib/push-client";

export default function PushSubscriber() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const status = getPushStatus();

    if (status === "granted") {
      syncSubscription();
      return;
    }
    if (status !== "default") return;

    // permission === "default": don't auto-request. iOS Safari silently
    // ignores requestPermission() calls that aren't triggered by a direct
    // user tap, so show a real button and request from its click handler.
    // Dismissed prompts stay away for the session; the account page has a
    // permanent "Turn on" button for anyone who skipped it.
    if (sessionStorage.getItem("push-prompt-dismissed")) return;
    setShowPrompt(true);
  }, []);

  async function enable() {
    setRequesting(true);
    try {
      await enablePush();
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
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:max-w-sm">
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
