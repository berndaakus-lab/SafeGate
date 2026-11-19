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

commit;
