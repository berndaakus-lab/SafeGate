-- Schools here call the same class Primary 3, Grade 3 and Basic 3 (and JHS 1 is
-- Basic 7), so every standard class name now shows all the names in use:
--   "Primary 3 / Grade 3 / Basic 3", "JHS 1 / Basic 7".
-- The old names stay recognised as spellings, so spreadsheets and typed values
-- using any of them still land on the same class.
--
-- Children keep their class (the link is by id); only the displayed text changes.
-- Classes a school added itself (sort_order 1000+) are not touched.
--
-- Run this AFTER 013. Safe to run more than once.

begin;

create temporary table new_names (sort_order int primary key, name text not null, aliases text[] not null) on commit drop;
insert into new_names (sort_order, name, aliases) values
  (6,  'Primary 1 / Grade 1 / Basic 1', '{"Primary 1","Grade 1","P1","Basic 1","Primary 1 / Grade 1"}'),
  (7,  'Primary 2 / Grade 2 / Basic 2', '{"Primary 2","Grade 2","P2","Basic 2","Primary 2 / Grade 2"}'),
  (8,  'Primary 3 / Grade 3 / Basic 3', '{"Primary 3","Grade 3","P3","Basic 3","Primary 3 / Grade 3"}'),
  (9,  'Primary 4 / Grade 4 / Basic 4', '{"Primary 4","Grade 4","P4","Basic 4","Primary 4 / Grade 4"}'),
  (10, 'Primary 5 / Grade 5 / Basic 5', '{"Primary 5","Grade 5","P5","Basic 5","Primary 5 / Grade 5"}'),
  (11, 'Primary 6 / Grade 6 / Basic 6', '{"Primary 6","Grade 6","P6","Basic 6","Primary 6 / Grade 6"}'),
  (12, 'JHS 1 / Basic 7', '{"JHS 1","JHS1","Basic 7","Grade 7"}'),
  (13, 'JHS 2 / Basic 8', '{"JHS 2","JHS2","Basic 8","Grade 8"}'),
  (14, 'JHS 3 / Basic 9', '{"JHS 3","JHS3","Basic 9","Grade 9"}');

-- The starter template used for new schools
update public.class_levels cl
set name = n.name, aliases = n.aliases
from new_names n
where cl.sort_order = n.sort_order;

-- Every school's starter classes (matched by position, so a school that renamed one is still updated)
update public.school_classes sc
set name = n.name, aliases = n.aliases
from new_names n
where sc.sort_order = n.sort_order and sc.sort_order < 1000;

-- The text shown next to each child follows the class
update public.students s
set class_name = sc.name
from public.school_classes sc
where s.class_id = sc.id and sc.sort_order between 6 and 14 and s.class_name is distinct from sc.name;

commit;
