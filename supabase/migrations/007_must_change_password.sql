-- Accounts created (or reset) by an admin get a temporary password the admin
-- knows. must_change_password forces the person to choose their own on first
-- sign-in. Existing accounts default to false so nobody is locked into the flow
-- retroactively.
--
-- Run this BEFORE deploying the code that writes must_change_password.

begin;

alter table public.parents add column if not exists must_change_password boolean not null default false;
alter table public.staff   add column if not exists must_change_password boolean not null default false;

commit;
