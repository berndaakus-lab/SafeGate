"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSubscriber() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") return;

    async function subscribe() {
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
        // while the browser-level subscription still succeeded, leaving our
        // database with no record of it. This POST is an idempotent upsert,
        // so re-sending an already-saved subscription is a harmless no-op.
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

    if (Notification.permission === "granted") {
      subscribe();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") subscribe();
      });
    }
  }, []);

  return null;
}
