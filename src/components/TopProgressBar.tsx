"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Global Material-style indeterminate progress bar. It watches the app's own
// server requests (form saves, confirms, router.refresh, page navigations,
// which Next.js loads via fetch) plus internal link clicks, so every action
// gets feedback without each button having to opt in.

type Listener = (pending: number) => void;
const listeners = new Set<Listener>();
let pending = 0;

function emit() {
  listeners.forEach((l) => l(pending));
}

function shouldTrack(input: RequestInfo | URL, init?: RequestInit): boolean {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.href);
  if (url.origin !== location.origin) return false;
  // next-auth polls the session in the background; not a user action
  if (url.pathname === "/api/auth/session") return false;
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  // Link prefetches happen on hover/viewport, not on a click
  if (headers.has("next-router-prefetch") || headers.get("purpose") === "prefetch") return false;
  return true;
}

function patchFetch() {
  const w = window as Window & { __progressFetchPatched?: boolean };
  if (w.__progressFetchPatched) return;
  w.__progressFetchPatched = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    let tracked = false;
    try {
      tracked = shouldTrack(input, init);
    } catch {
      tracked = false;
    }
    if (tracked) { pending++; emit(); }
    try {
      return await original(input, init);
    } finally {
      if (tracked) { pending = Math.max(0, pending - 1); emit(); }
    }
  };
}

export default function TopProgressBar() {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  // The pathname a link click started from; navigation is in progress while
  // we're still on it, so arriving at the new route ends it without an effect.
  const [navFrom, setNavFrom] = useState<string | null>(null);
  const navTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navSawRequest = useRef(false);

  useEffect(() => {
    patchFetch();
    const onChange: Listener = (n) => {
      setBusy(n > 0);
      // A click that only changed ?query keeps the same pathname, so it ends
      // when its requests finish instead.
      if (n > 0) navSawRequest.current = true;
      else if (navSawRequest.current) {
        navSawRequest.current = false;
        setNavFrom(null);
      }
    };
    listeners.add(onChange);

    // Start immediately on internal link clicks, before any request is made
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      navSawRequest.current = false;
      setNavFrom(location.pathname);
      // Never spin forever if a navigation is cancelled or fails silently
      if (navTimeout.current) clearTimeout(navTimeout.current);
      navTimeout.current = setTimeout(() => setNavFrom(null), 15000);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      listeners.delete(onChange);
      document.removeEventListener("click", onClick, true);
      if (navTimeout.current) clearTimeout(navTimeout.current);
    };
  }, []);

  const active = busy || navFrom === pathname;

  // The fade-in is delayed so requests that finish almost instantly never
  // show the bar; hiding is immediate.
  return (
    <div
      role="progressbar"
      aria-hidden={!active}
      aria-label="Loading"
      className={`fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden pointer-events-none transition-opacity ${
        active ? "opacity-100 duration-300 delay-150" : "opacity-0 duration-150 delay-0"
      }`}
      style={{ backgroundColor: "rgba(37, 99, 235, 0.18)" }}
    >
      {active && (
        <>
          <span className="progress-bar-1 absolute inset-y-0 bg-blue-600" />
          <span className="progress-bar-2 absolute inset-y-0 bg-blue-600" />
        </>
      )}
    </div>
  );
}
