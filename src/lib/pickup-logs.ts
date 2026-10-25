import { supabaseAdmin } from "./supabase";
import type { LogQuery, LogRow } from "./pickup-logs-shared";

export { parseLogQuery } from "./pickup-logs-shared";
export type { LogQuery, LogRow } from "./pickup-logs-shared";

/** One page of this school's pickups, filtered and counted in the database. */
export async function queryPickupLogs(schoolId: string, query: LogQuery): Promise<{ rows: LogRow[]; total: number; error?: string }> {
  let req = supabaseAdmin
    .from("pickup_log_details")
    .select("*", { count: "exact" })
    .eq("school_id", schoolId)
    .order("picked_up_at", { ascending: false })
    .order("id");

  // Characters that mean something in a filter expression or a LIKE pattern
  const term = query.q.replace(/[,()%_\\*"':]/g, " ").replace(/\s+/g, " ").trim();
  if (term) {
    const fields = ["student_name", "class_name", "collected_by", "parent_name", "released_by"];
    req = req.or(fields.map((f) => `${f}.ilike.%${term}%`).join(","));
  }
  if (query.from) req = req.gte("picked_up_at", `${query.from}T00:00:00.000Z`);
  if (query.to) req = req.lte("picked_up_at", `${query.to}T23:59:59.999Z`);

  const start = (query.page - 1) * query.pageSize;
  const { data, count, error } = await req.range(start, start + query.pageSize - 1);
  if (error) return { rows: [], total: 0, error: error.message };

  const rows: LogRow[] = (data ?? []).map((l: any) => ({
    id: l.id,
    picked_up_at: l.picked_up_at,
    studentName: l.student_name ?? "N/A",
    className: l.class_name ?? "",
    collectedBy: l.collected_by ?? "N/A",
    relation: l.relation ?? "",
    vehicleNumber: l.vehicle_number ?? "",
    parentName: l.parent_name ?? "N/A",
    releasedBy: l.released_by ?? null,
    releasedByRole: l.released_by_role ?? null,
    method: l.pickup_kind === "standing" ? "Standing pass" : l.pickup_kind === "lookup" ? "Parent approved" : "Daily code",
  }));
  return { rows, total: count ?? 0 };
}
