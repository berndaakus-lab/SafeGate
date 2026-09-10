import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import LogsClient from "./LogsClient";

export default async function LogsPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  // Get all student IDs for this school
  const { data: schoolStudents } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("school_id", schoolId);

  const studentIds = schoolStudents?.map((s: any) => s.id) ?? [];

  const { data: logs, error } = studentIds.length
    ? await supabaseAdmin
        .from("pickup_logs")
        .select(`
          id,
          picked_up_at,
          student_id,
          students(name, class_name),
          authorized_persons(name, relation),
          pickup_codes(parents(name, phone))
        `)
        .in("student_id", studentIds)
        .order("picked_up_at", { ascending: false })
        .limit(200)
    : { data: [], error: null };

  // Flatten for client
  const rows = (logs ?? []).map((l: any) => {
    const code = Array.isArray(l.pickup_codes) ? l.pickup_codes[0] : l.pickup_codes;
    const parent = code
      ? Array.isArray(code.parents) ? code.parents[0] : code.parents
      : null;
    return {
      id: l.id,
      picked_up_at: l.picked_up_at,
      studentName: l.students?.name ?? "N/A",
      className: l.students?.class_name ?? "",
      collectedBy: l.authorized_persons?.name ?? "N/A",
      relation: l.authorized_persons?.relation ?? "",
      parentName: parent?.name ?? "N/A",
    };
  });

  return <LogsClient logs={rows} />;
}
