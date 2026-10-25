import { encode, getToken } from "next-auth/jwt";
import type { NextRequest, NextResponse } from "next/server";
import { IDLE_TIMEOUT_MINUTES } from "./session-policy";

/**
 * After a person changes their OWN password, give them a fresh sign-in cookie
 * carrying the new password fingerprint, so they stay signed in on this device
 * while every other cookie (including a stolen one) stops working. This is done
 * here on the server, never from a browser request, so an old cookie can't
 * renew itself.
 */
export async function keepSignedInAfterPasswordChange(req: NextRequest, res: NextResponse, fingerprint: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return;
  const token = await getToken({ req, secret });
  if (!token) return;

  // Same rule NextAuth uses to pick the cookie name, so we replace the cookie it set
  const secure = process.env.NEXTAUTH_URL ? process.env.NEXTAUTH_URL.startsWith("https://") : !!process.env.VERCEL;
  const maxAge = IDLE_TIMEOUT_MINUTES * 60;
  const value = await encode({ token: { ...token, pwf: fingerprint, checkedAt: Date.now() }, secret, maxAge });
  res.cookies.set(`${secure ? "__Secure-" : ""}next-auth.session-token`, value, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
}
