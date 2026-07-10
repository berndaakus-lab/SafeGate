import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionSchoolId = (session?.user as any)?.schoolId;
    const { schoolId, studentName, className, parentEmail } = await req.json();
    if (!schoolId || !studentName || !parentEmail) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find parent by email within this school
    const { data: parent } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("email", parentEmail.trim().toLowerCase())
      .eq("school_id", schoolId)
      .single();

    if (!parent) {
      return NextResponse.json(
        { error: `No parent account found for ${parentEmail}` },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin.from("students").insert({
      name: studentName.trim(),
      class_name: className?.trim() || null,
      parent_id: parent.id,
      school_id: schoolId,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
