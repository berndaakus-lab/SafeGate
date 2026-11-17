"use client";

import { useRef, useState, useSyncExternalStore, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, Clock, Eye, EyeOff, Info, Loader2, LockKeyhole, ScanLine, UserRound } from "lucide-react";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/session-policy";
import { clearActivity, wasSignedOutForIdle } from "@/lib/sign-out";

const ROLE_HOME: Record<string, string> = {
  superadmin: "/superadmin/dashboard",
  admin: "/admin/dashboard",
  parent: "/parent/dashboard",
  guard: "/guard/scan",
  teacher: "/guard/scan",
};

// Solid white with a clear border, dark text and a left icon: easy to read on any phone
const FIELD =
  "w-full pl-11 py-3.5 rounded-xl border-[1.5px] border-slate-300 bg-white text-slate-900 text-base font-medium placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-colors";

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  // False in the server HTML and until React has attached the submit handler.
  // A tap before that (slow mobile data, a fresh Safari window) would do a
  // plain browser form submit that reloads this page with empty fields, so
  // the button stays disabled until the page is ready.
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  // The fields are uncontrolled and read only at submit: React state would
  // wipe anything typed or autofilled before the page finished loading, and
  // Safari/iOS Keychain autofill does not always fire a change event.
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const id = (identifierRef.current?.value ?? "").trim();
    const pw = passwordRef.current?.value ?? "";
    if (!id || !pw) {
      setError("Enter your email or phone number and your password.");
      return;
    }
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier: id,
        password: pw,
        redirect: false,
      });

      if (result?.error === "RateLimited" || result?.status === 429) {
        setError("Too many sign-in attempts. Please wait 5 minutes and try again.");
        setLoading(false);
        return;
      }
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
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <Image src="/icon-192.png" alt="VerifyGate" width={44} height={44} className="rounded-xl shadow-md shadow-blue-600/20" />
            <span className="font-serif text-3xl text-slate-900">VerifyGate</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-slate-600 text-[15px] mt-1">Sign in to your account</p>
        </div>

        <RedirectNotice />

        {/* Solid card: the fields must be easy to read on any phone, in bright sun too */}
        <div className="relative overflow-hidden rounded-3xl border border-white bg-white/95 backdrop-blur-xl shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_-18px_rgba(37,99,235,0.35)] p-6 sm:p-8">
          {/* Thin brand line along the top edge */}
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
          {/* While the submit button is disabled the browser won't submit on Enter either */}
          <form onSubmit={handleSubmit} className="relative space-y-5" autoComplete="on">
            <div>
              <label htmlFor="identifier" className="block text-sm font-semibold text-slate-900 mb-2">
                Email or phone number
              </label>
              <div className="relative">
              <UserRound aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={identifierRef}
                id="identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                autoFocus
                placeholder="e.g. 024 412 3456"
                className={`${FIELD} pr-4`}
              />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-2">
                Password
              </label>
              <div className="relative">
                <LockKeyhole aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className={`${FIELD} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex gap-2.5 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full bg-gradient-to-b from-blue-500 to-blue-700 text-white text-base py-4 rounded-xl font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_24px_-10px_rgba(37,99,235,0.8)] hover:from-blue-600 hover:to-blue-800 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {(loading || !ready) && <Loader2 className="w-5 h-5 animate-spin" />}
              {redirecting ? "Opening your dashboard..." : loading ? "Signing in..." : !ready ? "Loading..." : "Sign In"}
            </button>
          </form>
        </div>

        <Link
          href="/guard/scan"
          className="mt-6 mx-auto flex w-fit items-center gap-2 rounded-full bg-white/70 border border-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-white transition-colors"
        >
          <ScanLine className="w-4 h-4 text-blue-600" />
          Security guard? <span className="font-semibold text-blue-700">Open scanner</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
