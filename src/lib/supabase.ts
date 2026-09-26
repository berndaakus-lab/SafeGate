import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser / public use.
// Currently unused everywhere in the app (confirmed: no imports of { supabase }
// exist outside this file) and, after supabase/migrations/001_lockdown_anon_authenticated.sql
// is applied, the anon role has no table/sequence/function grants at all, so any
// query made with this client will return nothing rather than data. That's the
// safe default. If a future feature needs real browser-side Supabase access,
// it needs Supabase Auth wired up (this app currently authenticates via NextAuth
// against the staff/parents tables directly, not Supabase Auth) plus real RLS
// policies re-granting and scoping exactly the access that feature needs.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side API routes (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
