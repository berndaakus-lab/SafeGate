import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session?.user as any)?.schoolId;
    const { parentId, name, email, phone } = await req.json();

    if (!parentId || !name || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check email not taken by another parent
    const { data: existing } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("email", email)
      .neq("id", parentId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "That email is already used by another parent." }, { status: 409 });
    }

    const { error } = await supabaseAdmin
      .from("parents")
      .update({ name, email, phone: phone || null })
      .eq("id", parentId)
      .eq("school_id", schoolId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
