import { supabaseAdmin } from "./supabase";
import { escapeLike } from "./identity";

export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export type SameStudent = { id: string; name: string; parent_id: string | null; parentName: string | null };

/**
 * Active students in this school with the same name (ignoring capitals) and the
 * same class (or any class when none is given). Used to stop the same child being added twice and to match an
 * imported child to one already on the school's student list.
 */
export async function findSameStudents(schoolId: string, name: string, classId?: string | null): Promise<SameStudent[]> {
  let q = supabaseAdmin
    .from("students")
    .select("id, name, parent_id, parents(name)")
    .eq("school_id", schoolId)
    .is("archived_at", null)
    .ilike("name", escapeLike(cleanName(name)));
  // undefined = any class; null = children with no class
  if (classId !== undefined) q = classId ? q.eq("class_id", classId) : q.is("class_id", null);
  const { data } = await q.limit(20);
  return (data ?? []).map((s: any) => {
    const parent = Array.isArray(s.parents) ? s.parents[0] : s.parents;
    return { id: s.id, name: s.name, parent_id: s.parent_id, parentName: parent?.name ?? null };
  });
}

/**
 * A stand-in name for a parent the school only gave a child's name for:
 * "HAMZA DRAMANI" becomes "Parent of Hamza Dramani". The whole name is used
 * because which word is the surname varies, and guessing would be wrong. The
 * parent replaces it with their own name at first sign-in.
 */
export function placeholderParentName(childName: string | null | undefined): string | null {
  const name = cleanName(childName ?? "");
  if (!name) return null;
  // Names typed in all capitals or all lower case read better as Title Case
  const tidy = name === name.toUpperCase() || name === name.toLowerCase()
    ? name.toLowerCase().replace(/(^|[ '-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    : name;
  return `Parent of ${tidy}`;
}
