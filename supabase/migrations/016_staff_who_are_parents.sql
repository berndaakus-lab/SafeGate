-- Staff who are also parents.
--
-- A teacher (or guard, or admin) can also be a parent at the same school. Their
-- staff account is the only one they sign in with; the parent profile that holds
-- their children is linked to it with parents.staff_id and has no login of its
-- own (no login phone, no email, an unusable password). After signing in they
-- switch between the staff side and the parent side, and the server checks this
-- link on every switch and once a minute.
--
-- Run this BEFORE deploying the code that uses this column.

begin;

alter table public.parents
  add column if not exists staff_id uuid unique references public.staff(id) on delete set null;

-- A linked parent profile has no email or login phone of its own, and after an
-- unlink (or the staff account being deleted) it has none until the school adds
-- one with Edit. The app still requires a login when a parent is added or edited,
-- so the database check from 003 is dropped rather than widened.
alter table public.parents drop constraint if exists parents_has_login_identifier;

commit;
