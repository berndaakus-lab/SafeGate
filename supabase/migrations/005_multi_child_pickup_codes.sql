-- Lets one pickup QR code cover several children of the same parent.
--
-- pickup_codes.student_ids lists every child on a code. It is an array
-- column rather than a join table on purpose: a join table would give
-- PostgREST a second pickup_codes -> students relationship and make the
-- currently deployed `students(...)` embeds fail as ambiguous.
-- pickup_codes.student_id is kept (the first child) for older readers.
--
-- pickup_logs changes from one row per code to one row per child per code,
-- which also stops the same child being confirmed twice on one code.
--
-- Safe to run before deploying: the current code keeps working unchanged.

begin;

alter table public.pickup_codes add column if not exists student_ids uuid[];

update public.pickup_codes
set student_ids = array[student_id]
where student_ids is null and student_id is not null;

alter table public.pickup_logs drop constraint if exists pickup_logs_pickup_code_id_key;
create unique index if not exists pickup_logs_code_student_key on public.pickup_logs (pickup_code_id, student_id);

commit;
