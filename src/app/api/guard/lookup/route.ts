import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { escapeLike } from "@/lib/identity";

// Guard, teacher or admin on duty: find a child at THEIR school by name, with the
// people the parent has approved (and their photos). Used when someone arrives
// without a pass; the parent is then asked to approve (see /api/guard/approval).
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const schoolId = (session?.user as any)?.schoolId as string | undefined;
  if (!session || !["guard", "teacher", "admin"].includes(role) || !schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const term = (req.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (term.length < 2) return NextResponse.json({ children: [] });

  const { data: students, error } = await supabaseAdmin
    .from("students")
    .select("id, name, class_name, photo_url, parent_id")
    .eq("school_id", schoolId)
    .is("archived_at", null)
    .not("parent_id", "is", null)
    .ilike("name", `%${escapeLike(term)}%`)
    .order("name")
    .limit(8);
  if (error) return NextResponse.json({ error: "Search failed" }, { status: 500 });
  if (!students?.length) return NextResponse.json({ children: [] });

  const parentIds = [...new Set(students.map((s: any) => s.parent_id as string))];
  const { data: people } = await supabaseAdmin
    .from("authorized_persons")
    .select("id, parent_id, name, relation, photo_url, vehicle_number")
    .in("parent_id", parentIds)
    .order("name");

  return NextResponse.json({
    children: students.map((s: any) => ({
      id: s.id,
      name: s.name,
      class_name: s.class_name,
      photo_url: s.photo_url,
      persons: (people ?? [])
        .filter((p: any) => p.parent_id === s.parent_id)
        .map((p: any) => ({ id: p.id, name: p.name, relation: p.relation, photo_url: p.photo_url, vehicle_number: p.vehicle_number })),
    })),
  });
}
