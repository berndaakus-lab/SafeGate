"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { InfoNote } from "@/components/ui";
import { enablePush, getPushStatus, isIOS, syncSubscription, type PushStatus } from "@/lib/push-client";

export default function NotificationSettings() {
  // null until mounted: the status depends on the browser, not the server.
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const s = getPushStatus();
    setStatus(s);
    if (s === "granted") syncSubscription();
  }, []);

  async function turnOn() {
    setRequesting(true);
    try {
      setStatus(await enablePush());
    } finally {
      setRequesting(false);
    }
  }

  if (status === null) return <div className="h-12" />;

  if (status === "granted") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          <strong>Pickup alerts are on</strong> for this device.
        </span>
      </div>
    );
  }

  if (status === "default") {
    return (
      <div>
        <p className="text-sm text-slate-600 mb-3">
          Get notified the instant your child is picked up, even if the app is closed.
        </p>
        <button
          onClick={turnOn}
          disabled={requesting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <Bell className="w-4 h-4" /> {requesting ? "Requesting..." : "Turn on pickup alerts"}
        </button>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <InfoNote tone="amber">
        <p className="font-semibold flex items-center gap-1.5">
          <BellOff className="w-4 h-4" /> Notifications are blocked on this device
        </p>
        <p className="mt-1">
          {isIOS()
            ? "Open the iPhone Settings app, tap Notifications, find this app and turn on Allow Notifications. Then come back to this page."
            : "Tap the icon next to the web address (or open your browser's site settings), set Notifications to Allow, then reload this page."}
        </p>
      </InfoNote>
    );
  }

  if (status === "ios-not-installed") {
    return (
      <InfoNote>
        On iPhone, pickup alerts only work from the installed app. In Safari, tap the Share button, choose{" "}
        <strong>Add to Home Screen</strong>, then open the app from your home screen and turn alerts on here.
      </InfoNote>
    );
  }

  return (
    <InfoNote tone="amber">
      This browser can&apos;t receive notifications. You&apos;ll still get text messages about pickups.
    </InfoNote>
  );
}
