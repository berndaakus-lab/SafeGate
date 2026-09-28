"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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

      // Stay in the loading state through the role lookup and the dashboard
      // load; the page unmounts once navigation completes.
      setRedirecting(true);
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;

      const destination =
        role === "superadmin" ? "/superadmin/dashboard"
        : role === "admin" ? "/admin/dashboard"
        : role === "parent" ? "/parent/dashboard"
        : role === "guard" || role === "teacher" ? "/guard/scan"
        : null;

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
