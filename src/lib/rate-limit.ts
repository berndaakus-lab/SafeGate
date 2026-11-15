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

/** Counts one hit for `key` and says whether it is now over `max` within the window. */
export async function isRateLimited(key: string, windowMs: number, max: number): Promise<boolean> {
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

export function clientIp(headers: Headers | Record<string, string | string[] | undefined> | undefined): string {
  const raw = headers instanceof Headers ? headers.get("x-forwarded-for") : headers?.["x-forwarded-for"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.split(",")[0]?.trim() || "unknown";
}

// Sign-in limits, set far above anything a real person does so they never get
// in the way: a whole school can sign in from one Wi-Fi or carrier IP at
// pickup time, and a parent can mistype many times. They only stop automated
// password guessing (thousands of tries), which would otherwise be unlimited.
export const LOGIN_WINDOW_MS = 5 * 60_000;
export const LOGIN_MAX_PER_IP = 5000;
export const LOGIN_MAX_PER_ACCOUNT = 50;

/** Error code the login page recognises ("Too many sign-in attempts") */
export const RATE_LIMITED = "RateLimited";
