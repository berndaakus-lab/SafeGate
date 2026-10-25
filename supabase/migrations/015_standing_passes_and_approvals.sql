-- Fewer daily steps for parents:
--
-- 1. STANDING PASS. A pickup person can have one lasting QR pass (until the
--    parent cancels, until a date, or on school days only) covering the children
--    the parent chooses. Scanning it makes that day's code behind the scenes, so
--    every existing check (photo match, one pickup per child per day, text
--    message to the parent) still applies.
-- 2. USUAL PERSON. One pickup person per parent can be marked "usual" for the
--    one-tap daily code.
-- 3. PARENT APPROVAL (guard fallback). When someone arrives without a pass, a
--    guard looks the child up by name, picks the person from the parent's list,
--    and the parent gets a message with a link to approve or decline for today.
-- 4. pickup_codes.kind records how a code came about, and the pickup log view
--    exposes it so the school can see daily codes, standing passes and approvals.
--
-- Run this BEFORE deploying the code that uses these columns and tables.

begin;

alter table public.authorized_persons
  add column if not exists standing_token text unique,
  add column if not exists standing_until date,
  add column if not exists standing_school_days boolean not null default false,
  add column if not exists standing_started_at timestamptz,
  add column if not exists is_usual boolean not null default false;

-- Which children a person's standing pass covers
create table if not exists public.standing_pass_children (
  person_id uuid not null references public.authorized_persons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (person_id, student_id)
);
alter table public.standing_pass_children enable row level security;
revoke all on public.standing_pass_children from anon, authenticated;

-- How a pickup code was made, and (for standing passes) the day it is for
alter table public.pickup_codes
  add column if not exists kind text not null default 'daily',
  add column if not exists valid_on date;

alter table public.pickup_codes drop constraint if exists pickup_codes_kind_check;
alter table public.pickup_codes add constraint pickup_codes_kind_check check (kind in ('daily', 'standing', 'lookup'));

-- A standing pass makes at most one code per person per day, even if two guards scan at once
create unique index if not exists pickup_codes_standing_day_key
  on public.pickup_codes (authorized_person_id, valid_on) where kind = 'standing';

-- Guard asks, parent decides
create table if not exists public.pickup_approvals (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  authorized_person_id uuid not null references public.authorized_persons(id) on delete cascade,
  requested_by uuid references public.staff(id) on delete set null,
  requested_by_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'expired')),
  pickup_code_id uuid references public.pickup_codes(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  decided_at timestamptz
);
alter table public.pickup_approvals enable row level security;
revoke all on public.pickup_approvals from anon, authenticated;

-- One open request per child at a time (no repeat messages to the parent)
create unique index if not exists pickup_approvals_one_pending on public.pickup_approvals (student_id) where status = 'pending';

-- The pickup log view gains the method (appended, so existing readers are unaffected)
create or replace view public.pickup_log_details
with (security_invoker = true) as
select
  l.id,
  l.picked_up_at,
  s.school_id,
  s.id as student_id,
  s.name as student_name,
  coalesce(s.class_name, '') as class_name,
  ap.name as collected_by,
  ap.relation,
  ap.vehicle_number,
  p.name as parent_name,
  l.confirmed_by_name as released_by,
  l.confirmed_by_role as released_by_role,
  pc.kind as pickup_kind
from public.pickup_logs l
join public.students s on s.id = l.student_id
left join public.authorized_persons ap on ap.id = l.authorized_person_id
left join public.pickup_codes pc on pc.id = l.pickup_code_id
left join public.parents p on p.id = pc.parent_id;

-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so grant the server role explicitly (service_role only).
grant select, insert, update, delete on public.standing_pass_children to service_role;
grant select, insert, update, delete on public.pickup_approvals to service_role;

commit;
