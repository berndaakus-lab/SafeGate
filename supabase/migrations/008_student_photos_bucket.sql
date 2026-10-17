-- Creates the public storage bucket for child photos. Without it, uploads fail
-- with "Bucket not found". Photos are cropped to 320px JPEGs on the phone, so
-- the 1 MB cap is generous.
--
-- Run this in every environment (staging and production) that serves the app.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

commit;
