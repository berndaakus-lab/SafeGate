import { supabaseAdmin } from "./supabase";

export type SchoolClass = { id: string; name: string; aliases: string[] };

export async function getSchoolClasses(schoolId: string): Promise<SchoolClass[]> {
  const { data } = await supabaseAdmin
    .from("school_classes")
    .select("id, name, aliases")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");
  return (data ?? []) as SchoolClass[];
}

/** Gives a new school the starter classes (Creche to JHS) from the template table. */
export async function seedSchoolClasses(schoolId: string) {
  const { data: levels } = await supabaseAdmin.from("class_levels").select("name, aliases, sort_order");
  if (!levels?.length) return;
  await supabaseAdmin
    .from("school_classes")
    .insert(levels.map((l: any) => ({ school_id: schoolId, name: l.name, aliases: l.aliases, sort_order: l.sort_order })));
}

// Letters and digits only, so "PRIMARY 3", "primary-3" and "Primary3" all compare equal
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function cleanClassName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function findClass(input: string, classes: SchoolClass[]): SchoolClass | undefined {
  const key = norm(input);
  return key ? classes.find((c) => [c.name, ...c.aliases].some((n) => norm(n) === key)) : undefined;
}

/** Looks up one of the school's classes by name or alias (case, spacing and punctuation ignored). */
export function resolveClass(
  input: string | null | undefined,
  classes: SchoolClass[]
): { value: string | null; id: string | null } | { error: string } {
  const text = cleanClassName(input ?? "");
  if (!text) return { value: null, id: null };
  const match = findClass(text, classes);
  if (match) return { value: match.name, id: match.id };
  return { error: `"${text}" is not one of your school's classes. Add it under Classes first.` };
}

/**
 * Like resolveClass, but a name the school doesn't have yet is created. Used
 * by imports so a school's own names (3A, Adehye Class...) just work. `classes`
 * is updated in place so later rows in the same upload reuse the new class.
 */
export async function ensureClass(
  schoolId: string,
  input: string | null | undefined,
  classes: SchoolClass[]
): Promise<{ value: string | null; id: string | null } | { error: string }> {
  const text = cleanClassName(input ?? "");
  if (!text) return { value: null, id: null };
  if (text.length > 100) return { error: "That class name is too long (100 characters at most)." };
  const match = findClass(text, classes);
  if (match) return { value: match.name, id: match.id };

  const sortOrder = 1000 + classes.length;
  const { data, error } = await supabaseAdmin
    .from("school_classes")
    .insert({ school_id: schoolId, name: text, sort_order: sortOrder })
    .select("id, name, aliases")
    .single();
  if (error) {
    // A parallel request created the same class first: use theirs
    const fresh = await getSchoolClasses(schoolId);
    const again = findClass(text, fresh);
    if (again) {
      classes.splice(0, classes.length, ...fresh);
      return { value: again.name, id: again.id };
    }
    return { error: error.message };
  }
  classes.push(data as SchoolClass);
  return { value: data.name, id: data.id };
}
