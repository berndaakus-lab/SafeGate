import { NextRequest, NextResponse } from "next/server";
import { clientIp, isRateLimited, LOGIN_MAX_PER_IP, LOGIN_WINDOW_MS, RATE_LIMITED } from "@/lib/rate-limit";

// The per-account sign-in limit is checked in authorize() (src/lib/auth.ts),
// which has the identifier; reading the request body here would stall it.
const RATE_LIMITED_PATHS: { path: string; windowMs: number; max: number }[] = [
  { path: "/api/auth/callback/credentials", windowMs: LOGIN_WINDOW_MS, max: LOGIN_MAX_PER_IP },
  { path: "/api/demo-requests", windowMs: 60_000, max: 20 },
  // The public link in a parent's message: plenty for a real answer, little for guessing
  { path: "/api/approve", windowMs: 60_000, max: 20 },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "POST") {
    const rule = RATE_LIMITED_PATHS.find((r) => pathname.startsWith(r.path));
    if (rule) {
      const ip = clientIp(req.headers);
      if (await isRateLimited(`${rule.path}:${ip}`, rule.windowMs, rule.max)) {
        return NextResponse.json(
          {
            error: "Too many attempts. Please try again shortly.",
            // next-auth's signIn() reads the error from this url; without it the
            // login page could only say "could not reach the server"
            url: new URL(`/api/auth/error?error=${RATE_LIMITED}`, req.url).toString(),
          },
          { status: 429 }
        );
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
