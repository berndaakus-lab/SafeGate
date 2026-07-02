import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { school, admin } = await req.json();

    if (!school?.name || !admin?.name || !admin?.email || !admin?.password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check email not already taken
    const { data: existing } = await supabaseAdmin
      .from("staff")
      .select("id")
      .eq("email", admin.email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "A staff account with that email already exists." }, { status: 409 });
    }

    // Create school with 30-day trial defaults
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newSchool, error: schoolError } = await supabaseAdmin
      .from("schools")
      .insert({
        name: school.name,
        address: school.address || null,
        phone: school.phone || null,
        plan: "trial",
        trial_ends_at: trialEndsAt,
        max_students: 100,
      })
      .select()
      .single();

    if (schoolError) return NextResponse.json({ error: schoolError.message }, { status: 500 });

    // Create first admin
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    const { error: staffError } = await supabaseAdmin
      .from("staff")
      .insert({
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: "admin",
        school_id: newSchool.id,
      });

    if (staffError) {
      // Rollback school creation
      await supabaseAdmin.from("schools").delete().eq("id", newSchool.id);
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    return NextResponse.json({ school: newSchool }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
