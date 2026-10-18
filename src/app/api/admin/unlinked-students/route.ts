import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// School admin: students on the school's list who have no parent yet, for the
// "pick a child" box on the Parents page. Loaded when the box is opened so the
// page itself stays light for big schools.
export async function GET() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if ((session?.user as any)?.role !== "admin" || !schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, name, class_name")
    .eq("school_id", schoolId)
    .is("parent_id", null)
    .is("archived_at", null)
    .order("name")
    .limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data ?? [] });
}
