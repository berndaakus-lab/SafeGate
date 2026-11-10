import { supabaseAdmin } from "./supabase";

export type PickupChild = {
  id: string;
  name: string;
  class_name: string | null;
  photo_url: string | null;
  school_id: string | null;
  pickedUpAt: string | null;
  releasedBy: string | null;
};

type Log = { student_id: string; picked_up_at: string; confirmed_by_name: string | null };

function asArray<T>(v: T | T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

/** Loads a pickup code with every child on it and whether each has been picked up. */
export async function loadPickupCode(filter: { code: string } | { id: string }) {
  let q = supabaseAdmin.from("pickup_codes").select(`
    *,
    authorized_persons(name, phone, relation, photo_url, vehicle_number),
    parents(name, phone),
    pickup_logs(student_id, picked_up_at, confirmed_by_name)
  `);
  q = "code" in filter ? q.eq("code", filter.code) : q.eq("id", filter.id);
  const { data: pc } = await q.maybeSingle();
  if (!pc) return null;

  const ids: string[] = pc.student_ids?.length ? pc.student_ids : pc.student_id ? [pc.student_id] : [];
  const { data: students } = ids.length
    ? await supabaseAdmin
        .from("students")
        .select("id, name, class_name, photo_url, school_id, schools(name, logo_url)")
        .in("id", ids)
        .is("archived_at", null)
    : { data: [] as any[] };

  // A child is released once a day, whichever code was used: a pickup logged
  // today on any other code (daily code, regular pass, parent approval) counts too
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const { data: todayLogs } = ids.length
    ? await supabaseAdmin
        .from("pickup_logs")
        .select("student_id, picked_up_at, confirmed_by_name")
        .in("student_id", ids)
        .gte("picked_up_at", startOfToday.toISOString())
        .order("picked_up_at", { ascending: true })
    : { data: [] as Log[] };
  const logs: Log[] = [...asArray(pc.pickup_logs as Log | Log[] | null), ...((todayLogs ?? []) as Log[])];
  const children: PickupChild[] = ids
    .map((id) => students?.find((s: any) => s.id === id))
    .filter(Boolean)
    .map((s: any) => {
      const log = logs.find((l) => l.student_id === s.id);
      return {
        id: s.id,
        name: s.name,
        class_name: s.class_name,
        photo_url: s.photo_url,
        school_id: s.school_id,
        pickedUpAt: log?.picked_up_at ?? null,
        releasedBy: log?.confirmed_by_name ?? null,
      };
    });

  const firstSchool = (students?.[0] as any)?.schools;
  return {
    pickupCode: {
      id: pc.id as string,
      code: pc.code as string,
      kind: (pc.kind ?? "daily") as "daily" | "standing" | "lookup",
      expiresAt: pc.expires_at as string,
      parentId: pc.parent_id as string,
      authorizedPersonId: pc.authorized_person_id as string,
      authorizedPerson: asArray(pc.authorized_persons as any)[0] as
        | { name: string; phone: string | null; relation: string | null; photo_url: string | null; vehicle_number: string | null }
        | undefined,
      parent: asArray(pc.parents as any)[0] as { name: string; phone: string | null } | undefined,
    },
    children,
    school: firstSchool ? (Array.isArray(firstSchool) ? firstSchool[0] : firstSchool) as { name: string; logo_url: string | null } : null,
  };
}

/** Joins names naturally: "Kofi", "Kofi and Ama", "Kofi, Ama and Yaw". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
