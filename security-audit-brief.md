# Security Audit Brief

Act as a Senior Cyber Security Auditor and Application Security Engineer. Perform a comprehensive security audit of our Next.js / Supabase application before we onboard a client school tonight.

Inspect our codebase, database policies, API routes, and environment setups for the following critical security risks:

## 1. Supabase & Database Row Level Security (RLS)
- Check all Supabase tables in migrations/schema to ensure Row Level Security (RLS) is explicitly ENABLED.
- Verify that select, insert, update, and delete policies prevent cross-tenant data leaks (e.g., ensure a school admin or security guard from School A cannot query or modify data belonging to School B).
- Flag any overly permissive policies using `true` conditions or unauthenticated `anon` roles where `authenticated` or specific `role` checks should be enforced.

## 2. API Route & Server Action Authorization
- Audit all Next.js API endpoints (`app/api/**`) and Server Actions (`app/actions/**`).
- Ensure every sensitive handler verifies the user's session/token and checks authorization roles before performing operations.
- Flag any missing input validations (e.g., missing Zod schemas) that could lead to SQL injection, NoSQL injection, or mass assignment.

## 3. Authentication & Session Handling
- Ensure JWT/session validation is handled securely on protected pages and routes (e.g., via middleware or server-side checks).
- Confirm sensitive authentication tokens, Supabase service keys (`SUPABASE_SERVICE_ROLE_KEY`), or secret keys are NOT exposed in public client bundles (`NEXT_PUBLIC_` prefixes).

## 4. QR Code & Verification Security (VerifyGate-Specific)
- Verify how QR codes are generated and parsed: ensure QR payloads contain time-bound tokens, signed signatures, or non-predictable UUIDs rather than plain sequential IDs (to prevent QR spoofing or guessing).
- Ensure scanning/verification routes explicitly check student-to-delegate authorization mappings.

## 5. Client-Side Vulnerabilities & Headers
- Check for Cross-Site Scripting (XSS) risks (e.g., unescaped user inputs or dangerous `dangerouslySetInnerHTML` usages).
- Check `next.config.js` or middleware for essential security headers (Content Security Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).

## Deliverables
1. Security Audit Summary: A prioritized table of findings categorized by Severity (CRITICAL, HIGH, MEDIUM, LOW).
2. Actionable Code Patches: Provide exact file locations and code fixes for any CRITICAL or HIGH vulnerabilities discovered so we can apply them immediately.
