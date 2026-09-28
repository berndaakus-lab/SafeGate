-- Lets parents and staff sign in with a phone number instead of (or as well
-- as) an email, and makes stored emails lowercase so login is case-insensitive.
--
-- login_phone is the sign-in identifier only. The existing parents.phone
-- column is still the number SMS pickup alerts go to; the two may be the same
-- number or different, and nothing here changes how SMS is sent.
--
-- Run this BEFORE deploying the code that reads login_phone.

begin;

alter table public.parents add column if not exists login_phone text;
alter table public.staff   add column if not exists login_phone text;

create unique index if not exists parents_login_phone_key on public.parents (login_phone) where login_phone is not null;
create unique index if not exists staff_login_phone_key   on public.staff   (login_phone) where login_phone is not null;

alter table public.parents alter column email drop not null;
alter table public.staff   alter column email drop not null;

-- Blank emails would collide on the unique email constraint; store them as null.
update public.parents set email = null where email is not null and trim(email) = '';
update public.staff   set email = null where email is not null and trim(email) = '';

-- Lowercase existing emails. If this fails with a unique violation, two
-- accounts differ only by letter case; fix or delete one, then re-run.
update public.parents set email = lower(trim(email)) where email is not null and email <> lower(trim(email));
update public.staff   set email = lower(trim(email)) where email is not null and email <> lower(trim(email));

alter table public.parents drop constraint if exists parents_has_login_identifier;
alter table public.parents add constraint parents_has_login_identifier check (email is not null or login_phone is not null);
alter table public.staff drop constraint if exists staff_has_login_identifier;
alter table public.staff add constraint staff_has_login_identifier check (email is not null or login_phone is not null);

commit;
