-- Lock down the anon/authenticated Postgres roles.
--
-- Why: this app authenticates with NextAuth (Credentials provider against the
-- `staff`/`parents` tables directly), not Supabase Auth. Every database call
-- the app makes goes through `supabaseAdmin` (the service_role key), which
-- bypasses Row Level Security unconditionally, by Postgres/Supabase design,
-- regardless of any policy written. That means writing per-row RLS policies
-- keyed off `auth.uid()` here would be theater: there's no Supabase Auth JWT
-- for those policies to evaluate against, and service_role ignores RLS
-- entirely anyway.
--
-- What this migration actually does: schema.sql granted `ALL` on every table
-- to `anon` and `authenticated`, Supabase's defaults. RLS is enabled with
-- zero policies, so today those grants are inert (default-deny blocks every
-- row). But that combination is a trap: if anyone ever adds a policy to one
-- table for an unrelated reason (e.g. testing something in the Supabase
-- dashboard), the *already-granted* table-level access on every other table
-- is still sitting there ready to be exploited if a policy anywhere is ever
-- too permissive. Revoking the grants now means there is no ambient access
-- to walk back into, even by accident.
--
-- Run this in the Supabase SQL editor (or via the CLI) against your project.
-- It's non-destructive: it only revokes privileges from roles the app never
-- uses; the app's own service_role access is untouched.

REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "anon";
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "authenticated";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "anon";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "authenticated";
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM "anon";
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

-- USAGE on the schema itself is harmless to leave (it doesn't grant access to
-- any object) but revoking it too costs nothing since these roles are unused.
REVOKE USAGE ON SCHEMA "public" FROM "anon";
REVOKE USAGE ON SCHEMA "public" FROM "authenticated";
