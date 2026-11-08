-- Fixes the "Basic N" spellings. They were mapped with Basic 1 and 2 as
-- kindergarten (Basic 3 = Primary 1), but schools here use Basic 1-6 for
-- Primary 1-6 and Basic 7-9 for JHS 1-3. So "Basic 3" must land on Primary 3
-- and "Basic 7" on JHS 1.
--
-- This only corrects the spellings the app recognises. Children already imported
-- with a "Basic N" class were put in the wrong class and need the one-off repair
-- described in the chat/PR notes (it depends on the school and the import time).....
--
-- Safe to run more than once.

begin;

update public.class_levels set aliases = '{"Primary 1","Grade 1","P1","Basic 1"}' where name = 'Primary 1 / Grade 1';
update public.class_levels set aliases = '{"Primary 2","Grade 2","P2","Basic 2"}' where name = 'Primary 2 / Grade 2';
update public.class_levels set aliases = '{"Primary 3","Grade 3","P3","Basic 3"}' where name = 'Primary 3 / Grade 3';
update public.class_levels set aliases = '{"Primary 4","Grade 4","P4","Basic 4"}' where name = 'Primary 4 / Grade 4';
update public.class_levels set aliases = '{"Primary 5","Grade 5","P5","Basic 5"}' where name = 'Primary 5 / Grade 5';
update public.class_levels set aliases = '{"Primary 6","Grade 6","P6","Basic 6"}' where name = 'Primary 6 / Grade 6';
update public.class_levels set aliases = '{"Basic 7","Grade 7"}' where name = 'JHS 1';
update public.class_levels set aliases = '{"Basic 8","Grade 8"}' where name = 'JHS 2';
update public.class_levels set aliases = '{"Basic 9","Grade 9"}' where name = 'JHS 3';

-- Copy the corrected spellings to every school's starter classes. Matched by
-- position (sort_order) so a school that renamed one of them is still fixed;
-- classes a school added itself (sort_order 1000+) are left alone.
update public.school_classes sc
set aliases = cl.aliases
from public.class_levels cl
where sc.sort_order = cl.sort_order and sc.sort_order < 1000;

commit;
