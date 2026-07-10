import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionSchoolId = (session?.user as any)?.schoolId;
    const { name, email, password, role: staffRole, schoolId } = await req.json();

    if (!name || !email || !password || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existing } = await supabaseAdmin.from("staff").select("id").eq("email", email).single();
    if (existing) return NextResponse.json({ error: "Email already in use." }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 12);
    const { error } = await supabaseAdmin.from("staff").insert({
      name, email, password: hashedPassword,
      role: staffRole || "guard",
      school_id: schoolId,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
