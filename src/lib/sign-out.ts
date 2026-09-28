"use client";

import { signOut } from "next-auth/react";
import { IDLE_TIMEOUT_MS, LAST_ACTIVITY_KEY } from "./session-policy";

export function readLastActivity(): number {
  try {
    return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function recordActivity(at = Date.now()) {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    // Storage can be unavailable (private mode); the in-page timer still works
  }
}

export function clearActivity() {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // ignore
  }
}

/** True if this browser was signed in and then left idle past the limit. */
export function wasSignedOutForIdle(): boolean {
  const last = readLastActivity();
  return last > 0 && Date.now() - last > IDLE_TIMEOUT_MS;
}

/** A deliberate sign-out (a button). Clears the activity marker so the login
 * page doesn't later mistake it for an idle timeout. */
export function signOutUser(callbackUrl = "/login") {
  clearActivity();
  return signOut({ callbackUrl });
}
