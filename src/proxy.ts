import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Persistent, atomic rate limiting via the check_rate_limit() Postgres function
// (see supabase/migrations/002_rate_limits.sql — must be applied for this to
// take effect). Shared across every server instance, survives redeploys.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rateLimitDb = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// In-memory fallback: used only if the DB check fails (migration not yet run,
// or a transient outage), so rate limiting never goes to zero and a DB hiccup
// never blocks real traffic either. Per-instance and resets on redeploy.
const memoryHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimitedInMemory(key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const entry = memoryHits.get(key);
  if (!entry || now > entry.resetAt) {
    memoryHits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

async function isRateLimited(key: string, windowMs: number, max: number): Promise<boolean> {
  if (rateLimitDb) {
    const { data, error } = await rateLimitDb.rpc("check_rate_limit", {
      p_key: key,
      p_window_seconds: Math.round(windowMs / 1000),
      p_max: max,
    });
    if (!error) return Boolean(data);
    // Migration not applied yet, or a transient DB error: fall back rather
    // than fail open on the DB entirely.
  }
  return isRateLimitedInMemory(key, windowMs, max);
}

// Login attempts get a much tighter cap than general public forms, since
// this is the endpoint a password-guessing attack would actually hit.
const RATE_LIMITED_PATHS: { path: string; windowMs: number; max: number }[] = [
  { path: "/api/auth/callback/credentials", windowMs: 5 * 60_000, max: 8 },
  { path: "/api/demo-requests", windowMs: 60_000, max: 20 },
  { path: "/api/parent/children", windowMs: 60_000, max: 20 },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "POST") {
    const rule = RATE_LIMITED_PATHS.find((r) => pathname.startsWith(r.path));
    if (rule) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      if (await isRateLimited(`${rule.path}:${ip}`, rule.windowMs, rule.max)) {
        return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
      }
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // React's dev-mode HMR/debugging uses eval() for stack traces; never needed in production.
  const scriptSrc = process.env.NODE_ENV === "production"
    ? `script-src 'self' 'nonce-${nonce}'`
    : `script-src 'self' 'unsafe-eval' 'nonce-${nonce}'`;
  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets, so the CSP/nonce apply to all pages,
    // but skip _next/static, _next/image, and common static files for performance.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|json|xml|txt)$).*)",
  ],
};
