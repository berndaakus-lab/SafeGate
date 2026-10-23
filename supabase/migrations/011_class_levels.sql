-- Classes are managed per school. Each school has its own list (Creche to JHS to
-- start with, then whatever it needs: "3A", "3B", "Adehye Class"...), and
-- children are linked to one of them by id. Schools add, rename, import and
-- delete their own classes from the admin Parents page.
--
-- class_levels is only the starter template copied into each new school. Its
-- aliases ("Grade 3", "P3", "Basic 5"...) let a CSV in those spellings land on
-- the school's matching class. students.class_name stays as the display text so
-- every existing screen keeps working.
--
-- Existing children keep their classes: every distinct class a school already
-- uses becomes one of that school's classes, so nothing is lost or restricted.
--
-- Run this BEFORE deploying the code that reads school_classes.

begin;

create table if not exists public.class_levels (
  name text primary key,
  aliases text[] not null default '{}',
  sort_order integer not null unique
);
alter table public.class_levels enable row level security;
revoke all on public.class_levels from anon, authenticated;

insert into public.class_levels (name, aliases, sort_order) values
  ('Creche',              '{}', 1),
  ('Nursery 1',           '{}', 2),
  ('Nursery 2',           '{}', 3),
  ('KG 1',                '{"Kindergarten 1"}', 4),
  ('KG 2',                '{"Kindergarten 2"}', 5),
  ('Primary 1 / Grade 1', '{"Primary 1","Grade 1","P1","Basic 3"}', 6),
  ('Primary 2 / Grade 2', '{"Primary 2","Grade 2","P2","Basic 4"}', 7),
  ('Primary 3 / Grade 3', '{"Primary 3","Grade 3","P3","Basic 5"}', 8),
  ('Primary 4 / Grade 4', '{"Primary 4","Grade 4","P4","Basic 6"}', 9),
  ('Primary 5 / Grade 5', '{"Primary 5","Grade 5","P5","Basic 7"}', 10),
  ('Primary 6 / Grade 6', '{"Primary 6","Grade 6","P6","Basic 8"}', 11),
  ('JHS 1',               '{"Basic 9"}', 12),
  ('JHS 2',               '{"Basic 10"}', 13),
  ('JHS 3',               '{"Basic 11"}', 14)
on conflict (name) do nothing;

create table if not exists public.school_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  aliases text[] not null default '{}',
  sort_order integer not null default 0,
  -- letters and digits only, so "primary 3" and "Primary-3" can't both exist
  key text generated always as (lower(regexp_replace(name, '[^a-zA-Z0-9]+', '', 'g'))) stored,
  created_at timestamptz not null default now(),
  unique (school_id, key)
);
alter table public.school_classes enable row level security;
revoke all on public.school_classes from anon, authenticated;

alter table public.students
  add column if not exists class_id uuid references public.school_classes(id) on delete set null;
create index if not exists students_class_id_idx on public.students (class_id);

-- 1. Give every existing school the starter classes
insert into public.school_classes (school_id, name, aliases, sort_order)
select s.id, l.name, l.aliases, l.sort_order
from public.schools s cross join public.class_levels l
on conflict (school_id, key) do nothing;

-- 2. Every other class a school already uses (e.g. "Class 3A") becomes its own class
insert into public.school_classes (school_id, name, sort_order)
select school_id, name, 1000 + row_number() over (partition by school_id order by name)
from (
  select distinct s.school_id, regexp_replace(trim(s.class_name), '\s+', ' ', 'g') as name
  from public.students s
  where s.class_name is not null and trim(s.class_name) <> '' and s.school_id is not null
) used
where not exists (
  select 1 from public.school_classes c
  where c.school_id = used.school_id
    and (c.key = lower(regexp_replace(used.name, '[^a-zA-Z0-9]+', '', 'g'))
         or exists (select 1 from unnest(c.aliases) a
                    where lower(regexp_replace(a, '[^a-zA-Z0-9]+', '', 'g')) = lower(regexp_replace(used.name, '[^a-zA-Z0-9]+', '', 'g'))))
)
on conflict (school_id, key) do nothing;

-- 3. Link each child to their school's class and normalise the display text
update public.students s
set class_id = c.id, class_name = c.name
from public.school_classes c
where s.class_id is null
  and s.school_id = c.school_id
  and s.class_name is not null
  and (lower(regexp_replace(s.class_name, '[^a-zA-Z0-9]+', '', 'g')) = c.key
       or exists (select 1 from unnest(c.aliases) a
                  where lower(regexp_replace(a, '[^a-zA-Z0-9]+', '', 'g')) = lower(regexp_replace(s.class_name, '[^a-zA-Z0-9]+', '', 'g'))));

-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so grant the server role explicitly. Only service_role: the app
-- never uses anon/authenticated, and migration 001 keeps them locked out.
grant select, insert, update, delete on public.class_levels to service_role;
grant select, insert, update, delete on public.school_classes to service_role;

commit;
