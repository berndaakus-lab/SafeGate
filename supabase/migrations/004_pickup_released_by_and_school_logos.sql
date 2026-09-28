-- 1. Record which staff member (guard or on-duty teacher) released each child.
--    The name and role are saved at the moment of pickup so the log stays
--    accurate even if the staff account is later renamed or deleted.
-- 2. Create the public storage bucket for school logos.
--
-- Run this BEFORE deploying the code that writes these columns, otherwise
-- pickup confirmations will fail.

begin;

alter table public.pickup_logs
  add column if not exists confirmed_by_staff_id uuid references public.staff(id) on delete set null,
  add column if not exists confirmed_by_name text,
  add column if not exists confirmed_by_role text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-logos', 'school-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

commit;
