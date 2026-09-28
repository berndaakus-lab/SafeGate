"use client";

import { useEffect } from "react";
import { getSession, signOut } from "next-auth/react";
import { IDLE_TIMEOUT_MS } from "@/lib/session-policy";
import { readLastActivity, recordActivity } from "@/lib/sign-out";

// While the user is active, re-issue the session cookie (each /api/auth/session
// call resets its 1-hour expiry) at most this often.
const REFRESH_EVERY_MS = 60_000;
const CHECK_EVERY_MS = 30_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll", "wheel"] as const;

/** Signs the user out after IDLE_TIMEOUT_MS with no activity in any tab, and
 * keeps the server session alive while they are active. */
export default function IdleSessionGuard() {
  useEffect(() => {
    let lastRefresh = Date.now();
    let signingOut = false;

    function expire() {
      if (signingOut) return;
      signingOut = true;
      // The activity marker is left in place: the login page reads it to
      // explain that this was an idle sign-out.
      signOut({ callbackUrl: "/login?reason=idle" });
    }

    function check() {
      const last = readLastActivity();
      if (last && Date.now() - last > IDLE_TIMEOUT_MS) expire();
    }

    // Reopening the app (or waking the phone) after the limit signs out at
    // once, before any data is shown for long.
    check();
    if (!signingOut) recordActivity();

    function onActivity() {
      if (signingOut) return;
      const now = Date.now();
      recordActivity(now);
      if (now - lastRefresh > REFRESH_EVERY_MS) {
        lastRefresh = now;
        getSession().then((s) => {
          if (!s) expire();
        });
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") check();
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(check, CHECK_EVERY_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, []);

  return null;
}
