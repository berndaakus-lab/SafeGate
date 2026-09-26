-- Persistent, atomic rate limiting backed by Postgres (instead of the
-- in-memory Map in src/proxy.ts, which resets on redeploy and isn't shared
-- across serverless instances). Reuses the database you already have —
-- no new infrastructure.

CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
  "key" "text" PRIMARY KEY,
  "count" integer NOT NULL DEFAULT 1,
  "reset_at" timestamptz NOT NULL
);

ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;
-- No policies: this table is only ever touched by supabaseAdmin (service_role),
-- which bypasses RLS, consistent with the rest of the app. anon/authenticated
-- get no grants by default (see migrations/001_lockdown_anon_authenticated.sql).

-- Atomic check-and-increment. A single INSERT ... ON CONFLICT statement takes
-- Postgres's row-level lock, so concurrent requests for the same key can't
-- race each other into undercounting.
CREATE OR REPLACE FUNCTION "public"."check_rate_limit"(
  "p_key" "text",
  "p_window_seconds" integer,
  "p_max" integer
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO "public"."rate_limits" ("key", "count", "reset_at")
  VALUES (p_key, 1, now() + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT ("key") DO UPDATE SET
    "count" = CASE
      WHEN "rate_limits"."reset_at" < now() THEN 1
      ELSE "rate_limits"."count" + 1
    END,
    "reset_at" = CASE
      WHEN "rate_limits"."reset_at" < now() THEN now() + (p_window_seconds || ' seconds')::interval
      ELSE "rate_limits"."reset_at"
    END
  RETURNING "count" INTO v_count;

  RETURN v_count > p_max;
END;
$$;

REVOKE ALL ON FUNCTION "public"."check_rate_limit"(text, integer, integer) FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."check_rate_limit"(text, integer, integer) TO "service_role";
