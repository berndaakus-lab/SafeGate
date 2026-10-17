-- Lets a school archive a child who has left or graduated. Archived children
-- disappear from parent screens and pickup passes but stay in the database, so
-- past pickup logs (which reference the child) keep their history. An admin can
-- restore a child at any time.
--
-- Run this BEFORE deploying the code that reads archived_at.

begin;

alter table public.students add column if not exists archived_at timestamptz;

commit;
