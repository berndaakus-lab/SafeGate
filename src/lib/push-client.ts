// Browser-side web push helpers, shared by the first-visit prompt
// (PushSubscriber) and the toggle on the parent's account page.

export type PushStatus =
  | "unsupported" // browser has no web push at all
  | "ios-not-installed" // iOS only allows push from the installed home-screen app
  | "denied" // user blocked notifications; only browser settings can undo it
  | "default" // never asked, or asked and dismissed
  | "granted";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

export function getPushStatus(): PushStatus {
  if (typeof window === "undefined") return "unsupported";
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
  // iOS only supports web push from an installed (standalone) PWA, never
  // from a regular Safari tab. Check this first: Safari tabs on iOS may not
  // even expose PushManager, and we want to tell them how to fix it.
  if (isIOS() && !isStandalone) return "ios-not-installed";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as PushStatus;
}

/** Make sure this device has a push subscription and the server knows it. */
export async function syncSubscription(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      const { key } = await fetch("/api/push/vapid-public-key").then((r) => r.json());
      if (!key) return false;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }

    // Always sync with the server, even if the browser already had a
    // subscription: a past server-side save could have failed silently
    // while the browser-level subscription still succeeded. Idempotent
    // upsert, so re-sending an already-saved subscription is a no-op.
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });
    return res.ok;
  } catch (e) {
    // Push is optional, SMS is the fallback
    console.warn("[push] subscription failed:", e);
    return false;
  }
}

/**
 * Ask for permission and subscribe. Must be called from a click handler:
 * iOS Safari ignores requestPermission() calls that aren't a direct tap.
 */
export async function enablePush(): Promise<PushStatus> {
  const perm = await Notification.requestPermission();
  if (perm === "granted") await syncSubscription();
  return perm as PushStatus;
}
