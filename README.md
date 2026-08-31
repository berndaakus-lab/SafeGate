# VerifyGate

Secure, digital school pickup authorization for parents, schools, and security guards.

Parents generate time-limited QR pickup passes, guards scan and confirm pickups, and schools get a full audit trail with instant SMS alerts.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Supabase](https://supabase.com) for data and auth storage
- NextAuth for session management
- Tailwind CSS + Radix UI
- Web Push for pickup notifications, SMS via configurable provider

## Environment

Copy `.env.example` (if present) or see `src/lib/` for the required environment variables: Supabase URL/keys, NextAuth secret, VAPID push keys, SMS provider credentials, and Paystack keys for payments.

## Deployment

Deployed on Vercel at [verifygate.app](https://verifygate.app).
