-- Paid subscription periods, verified payments, and trial/renewal reminders.
--
-- schools.paid_until : end of the current paid period (null = never paid).
--                      Status is derived from this and trial_ends_at; nothing
--                      is suspended automatically (the superadmin decides).
-- payments           : one row per MoMo charge. The amount is decided by the
--                      server when the charge is created and checked against
--                      what Paystack actually charged before a school is
--                      credited, so the browser can no longer set the price.
-- subscription_reminders : one row per SMS reminder sent, so the 14/7/3-day
--                      reminders go out at most once per period.
-- job_runs           : throttle for the background job that sends reminders
--                      and follows up unconfirmed payments.
--
-- Run this BEFORE deploying the code that uses these tables.

begin;

alter table public.schools add column if not exists paid_until timestamptz;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  reference text not null unique,
  months integer not null check (months in (1, 3, 6, 12)),
  tier text not null,
  amount_pesewas integer not null check (amount_pesewas > 0),
  currency text not null default 'GHS',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  failure_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_school_id_idx on public.payments (school_id, created_at desc);
create index if not exists payments_pending_idx on public.payments (created_at) where status = 'pending';

create table if not exists public.subscription_reminders (
  school_id uuid not null references public.schools(id) on delete cascade,
  kind text not null check (kind in ('trial', 'renewal')),
  period_end date not null,
  days_before integer not null,
  recipients integer not null default 0,
  sent_at timestamptz not null default now(),
  primary key (school_id, kind, period_end, days_before)
);

create table if not exists public.job_runs (
  name text primary key,
  last_run_at timestamptz not null default 'epoch'
);
insert into public.job_runs (name) values ('subscriptions') on conflict do nothing;

alter table public.payments enable row level security;
alter table public.subscription_reminders enable row level security;
alter table public.job_runs enable row level security;
revoke all on public.payments, public.subscription_reminders, public.job_runs from anon, authenticated;

-- Existing schools already on a paid plan had no end date. Give them a
-- paid period of 30 days from now (edit per school on its page if needed),
-- and replace the old generic "school" plan with the Growth tier it was
-- priced at.
update public.schools
set paid_until = now() + interval '30 days'
where paid_until is null and plan is not null and plan <> 'trial';

update public.schools set plan = 'growth' where plan = 'school';

commit;
