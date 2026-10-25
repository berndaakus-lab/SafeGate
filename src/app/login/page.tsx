"use client";

import { useState, useSyncExternalStore, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/session-policy";
import { clearActivity, wasSignedOutForIdle } from "@/lib/sign-out";

const ROLE_HOME: Record<string, string> = {
  superadmin: "/superadmin/dashboard",
  admin: "/admin/dashboard",
  parent: "/parent/dashboard",
  guard: "/guard/scan",
  teacher: "/guard/scan",
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: "a platform admin",
  admin: "a school admin",
  parent: "a parent",
  guard: "a guard",
  teacher: "a teacher",
};

// Where the person was trying to go, and who that area is for
const AREA: Record<string, { name: string; who: string }> = {
  scanner: { name: "The pickup scanner", who: "guards, on-duty teachers and school admins" },
  admin: { name: "The school admin area", who: "school admins" },
  parent: { name: "The parent area", who: "parents" },
  superadmin: { name: "The platform admin area", who: "the VerifyGate platform admin" },
};

/** Explains why the person was sent to the login page, based on the
 * ?reason=&for=&as= set by the protected layouts' redirects. */
function RedirectNotice() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const area = AREA[params.get("for") ?? ""];
  const as = params.get("as") ?? "";
  // A closed app reopened after the limit arrives here as a plain "signin"
  // redirect (the expired cookie is simply gone); the stale activity marker
  // tells us it was actually an idle timeout.
  const idleMarker = useSyncExternalStore(() => () => {}, wasSignedOutForIdle, () => false);

  if (reason === "idle" || (reason === "signin" && idleMarker)) {
    return (
      <div role="status" className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-900">
        <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <div className="space-y-1">
          <p className="font-semibold">You were signed out</p>
          <p className="text-amber-800/90">
            For security, you&apos;re signed out after {IDLE_TIMEOUT_MINUTES} minutes without activity. Sign in again to continue.
          </p>
        </div>
      </div>
    );
  }

  if (!area || (reason !== "signin" && reason !== "role")) return null;

  const wrongAccount = reason === "role";
  return (
    <div role="status" className="mb-4 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/90 px-4 py-3.5 text-sm text-blue-900">
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
      <div className="space-y-1">
        <p className="font-semibold">{wrongAccount ? "This page isn't for your account" : "Please sign in first"}</p>
        <p className="text-blue-800/90">
          {wrongAccount && ROLE_LABEL[as] ? `You're signed in as ${ROLE_LABEL[as]}. ` : ""}
          {area.name} is only for {area.who}.
          {wrongAccount ? " Sign in with the right account below." : " Sign in to continue."}
        </p>
        {wrongAccount && ROLE_HOME[as] && (
          <Link href={ROLE_HOME[as]} className="inline-block font-semibold text-blue-700 underline underline-offset-2">
            Go back to your dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email/phone number or password.");
        setLoading(false);
        return;
      }

      // A fresh sign-in starts a fresh idle clock; without this a stale marker
      // (e.g. the previous person on a shared school laptop) would sign this
      // user straight back out.
      clearActivity();

      // Stay in the loading state through the role lookup and the dashboard
      // load; the page unmounts once navigation completes.
      setRedirecting(true);
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;

      const destination = ROLE_HOME[role] ?? null;

      if (!destination) {
        setError("Signed in, but your account has no role. Contact your school.");
        setLoading(false);
        setRedirecting(false);
        return;
      }
      router.replace(destination);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
      setRedirecting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-200 flex items-center justify-center px-4 py-12"
      style={{ paddingTop: "max(3rem, env(safe-area-inset-top))", paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}
    >
      {/* Soft coloured light behind the glass card, static so it never distracts from the form */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-blue-400/50 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-[22rem] h-[22rem] rounded-full bg-cyan-300/60 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-[30rem] h-[30rem] rounded-full bg-indigo-400/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: "radial-gradient(#93c5fd 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm animate-hero-rise">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <Image src="/icon-192.png" alt="VerifyGate" width={40} height={40} className="rounded-xl shadow-sm" />
            <span className="font-serif text-3xl text-slate-900">VerifyGate</span>
          </Link>
          <p className="text-slate-600 text-sm">Sign in to your account</p>
        </div>

        <RedirectNotice />

        {/* Glass card: two bright shapes sit behind it so the frosted blur is visible */}
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute -top-7 -left-8 w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 opacity-80" />
          <div aria-hidden className="pointer-events-none absolute -bottom-9 -right-7 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-400 opacity-80" />
        <div className="relative z-10 overflow-hidden rounded-3xl border border-white/60 bg-white/80 supports-[backdrop-filter]:bg-white/30 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.3),0_24px_60px_-20px_rgba(37,99,235,0.35)] p-6 sm:p-8">
          {/* Light catching the top edge of the glass */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent" />
          <form onSubmit={handleSubmit} className="relative space-y-4" autoComplete="on">
            <div>
              <label htmlFor="identifier" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email or phone number
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com or 024 412 3456"
                className="w-full px-4 py-3.5 sm:py-3 rounded-xl border border-white/70 bg-white/55 backdrop-blur-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 sm:py-3 rounded-xl border border-white/70 bg-white/55 backdrop-blur-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 -m-1.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-b from-blue-500 to-blue-700 text-white py-3.5 sm:py-3 rounded-xl font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_24px_-8px_rgba(37,99,235,0.7)] hover:from-blue-500 hover:to-blue-800 active:from-blue-600 active:to-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {redirecting ? "Opening your dashboard..." : loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">
          Security guard?{" "}
          <Link href="/guard/scan" className="text-blue-600 hover:underline font-medium">
            Open scanner
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
