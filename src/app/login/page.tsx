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
    <div className="relative min-h-screen overflow-hidden bg-slate-50 flex items-center justify-center px-4 py-12"
      style={{ paddingTop: "max(3rem, env(safe-area-inset-top))", paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}
    >
      {/* Branded background: soft radial glow + faint dot grid, static so it never distracts from the form */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-indigo-200/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
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
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>

        <RedirectNotice />

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                className="w-full px-4 py-3.5 sm:py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                  className="w-full px-4 py-3.5 sm:py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 text-base"
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
              className="w-full bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {redirecting ? "Opening your dashboard..." : loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
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
