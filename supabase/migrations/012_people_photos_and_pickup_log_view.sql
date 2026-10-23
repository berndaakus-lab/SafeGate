-- 1. Pickup persons can have a photo, and drivers a car number.
--    Photos go in their own public bucket (same rules as student photos).
-- 2. pickup_log_details: one flat row per child released, joining the student,
--    collector, parent and staff member. The admin Pickup Logs page reads it so
--    search, date filters, paging and CSV/PDF export all run in the database
--    instead of loading everything into the browser.
--
-- Run this BEFORE deploying the code that uses vehicle_number, person-photos
-- or pickup_log_details.

begin;

alter table public.authorized_persons add column if not exists vehicle_number text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('person-photos', 'person-photos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

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
  l.confirmed_by_role as released_by_role
from public.pickup_logs l
join public.students s on s.id = l.student_id
left join public.authorized_persons ap on ap.id = l.authorized_person_id
left join public.pickup_codes pc on pc.id = l.pickup_code_id
left join public.parents p on p.id = pc.parent_id;

-- Reached only through the service role (see migration 001)
revoke all on public.pickup_log_details from anon, authenticated;

create index if not exists pickup_logs_picked_up_at_idx on public.pickup_logs (picked_up_at desc);

-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so grant the server role explicitly. Only service_role: the app
-- never uses anon/authenticated, and migration 001 keeps them locked out.
grant select on public.pickup_log_details to service_role;

commit;
