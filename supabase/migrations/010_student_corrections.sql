-- Parents can't edit a child's name or class (only the school can), so they
-- flag a mistake here and the school admin fixes it and marks it done.
--
-- Run this BEFORE deploying the code that uses student_corrections.

begin;

create table if not exists public.student_corrections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id uuid not null references public.parents(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists student_corrections_open_idx
  on public.student_corrections (school_id) where resolved_at is null;

-- The app only reaches this through the service role (see migration 001).
alter table public.student_corrections enable row level security;
revoke all on public.student_corrections from anon, authenticated;

commit;
